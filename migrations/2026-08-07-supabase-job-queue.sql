-- Migration: replace Redis/BullMQ with a Supabase-backed job queue
-- Run this once against your existing Supabase database via SQL Editor.
-- Safe to re-run (uses IF NOT EXISTS guards throughout).
--
-- Why: the API previously fell back to running sends synchronously inline
-- on the HTTP request whenever REDIS_URL was unset or Redis was unreachable
-- (see apps/api/src/queue/index.ts, old addToMessageQueue/addCampaignJob/
-- addWebhookJob). That fallback is what caused POST /conversations/:id/send
-- to hang until the reverse proxy's timeout fired (504), since the request
-- was blocked on a live call to the Meta Graph API instead of just
-- enqueueing work. This table lets every "add a job" call be a single fast
-- INSERT, with a background poller in the API process doing the actual work.

CREATE TABLE IF NOT EXISTS job_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_type TEXT NOT NULL CHECK (job_type IN ('message', 'campaign', 'webhook')),
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 3,
  last_error TEXT,
  run_after TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Poller claims the oldest due, pending jobs first.
CREATE INDEX IF NOT EXISTS idx_job_queue_claim ON job_queue (status, run_after, created_at)
  WHERE status = 'pending';
