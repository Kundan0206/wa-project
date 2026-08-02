-- Migration: Meta Event Logs (full audit trail of every Meta webhook event)
-- Run this once against your existing Supabase database via SQL Editor.
-- Safe to re-run (uses IF NOT EXISTS / IF EXISTS guards throughout).

-- 1. New columns needed on existing tables
ALTER TABLE phone_numbers ADD COLUMN IF NOT EXISTS messaging_limit TEXT;

-- templates.quality_score was INT but Meta sends a string enum
-- (GREEN / YELLOW / RED / UNKNOWN) on quality update events.
ALTER TABLE templates ALTER COLUMN quality_score TYPE TEXT USING quality_score::TEXT;

-- 2. New table: raw log of every event Meta delivers to our webhook
CREATE TABLE IF NOT EXISTS meta_event_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  waba_id TEXT,
  phone_number_id TEXT,
  entity_id TEXT,
  summary TEXT,
  payload JSONB NOT NULL,
  status TEXT DEFAULT 'processed',
  error_message TEXT,
  received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meta_event_logs_tenant ON meta_event_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_meta_event_logs_type ON meta_event_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_meta_event_logs_received ON meta_event_logs(received_at DESC);
