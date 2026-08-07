-- Migration: allow phone number / WABA deletion when history references it
-- Run this once against your existing Supabase database via SQL Editor.
-- Safe to re-run (drops + recreates the constraints each time).
--
-- Without this, deleting a WABA account fails with a foreign-key violation
-- (23503) as soon as any campaign/conversation/flow references one of its
-- phone numbers - which any number that's actually been used will have.
-- The delete then errors out silently on the frontend and the WABA/number
-- appears to "not delete" from the dashboard.

ALTER TABLE campaigns DROP CONSTRAINT IF EXISTS campaigns_phone_number_id_fkey;
ALTER TABLE campaigns
  ADD CONSTRAINT campaigns_phone_number_id_fkey
  FOREIGN KEY (phone_number_id) REFERENCES phone_numbers(id) ON DELETE SET NULL;

ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_phone_number_id_fkey;
ALTER TABLE conversations
  ADD CONSTRAINT conversations_phone_number_id_fkey
  FOREIGN KEY (phone_number_id) REFERENCES phone_numbers(id) ON DELETE SET NULL;

ALTER TABLE flows DROP CONSTRAINT IF EXISTS flows_phone_number_id_fkey;
ALTER TABLE flows
  ADD CONSTRAINT flows_phone_number_id_fkey
  FOREIGN KEY (phone_number_id) REFERENCES phone_numbers(id) ON DELETE SET NULL;
