-- WhatsApp Tech Provider SaaS Platform - Supabase Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tenants table
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan TEXT DEFAULT 'free',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table (linked to Supabase Auth)
CREATE TABLE users (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  password_hash TEXT DEFAULT 'managed_by_supabase_auth',
  role TEXT DEFAULT 'admin',
  name TEXT NOT NULL,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, email)
);

-- API Keys table
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  prefix TEXT NOT NULL,
  scopes TEXT[] DEFAULT ARRAY['messages:send', 'messages:read']::TEXT[],
  last_used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);

-- WhatsApp Business Accounts (WABA)
CREATE TABLE waba_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  waba_id TEXT UNIQUE NOT NULL,
  waba_name TEXT NOT NULL,
  access_token TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  currency TEXT DEFAULT 'USD',
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Phone Numbers
CREATE TABLE phone_numbers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  waba_id UUID REFERENCES waba_accounts(id) ON DELETE CASCADE,
  phone_number_id TEXT UNIQUE NOT NULL,
  display_number TEXT NOT NULL,
  display_name TEXT NOT NULL,
  quality_rating TEXT,
  messaging_limit TEXT,
  status TEXT DEFAULT 'pending',
  is_default BOOLEAN DEFAULT false,
  webhook_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  phone_number_id UUID REFERENCES phone_numbers(id) ON DELETE CASCADE,
  wamid TEXT,
  direction TEXT NOT NULL,
  recipient TEXT NOT NULL,
  sender TEXT NOT NULL,
  type TEXT NOT NULL,
  content TEXT,
  status TEXT DEFAULT 'queued',
  template_id UUID,
  campaign_id UUID,
  conversation_id UUID,
  contact_id UUID,
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  error_code TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contacts
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  name TEXT,
  email TEXT,
  country_code TEXT,
  language TEXT DEFAULT 'en',
  custom_fields JSONB,
  opted_in BOOLEAN DEFAULT false,
  opted_in_at TIMESTAMP WITH TIME ZONE,
  opted_out_at TIMESTAMP WITH TIME ZONE,
  last_message_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, phone)
);

-- Contact Tags
CREATE TABLE contact_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(contact_id, tag)
);

-- Contact Segments
CREATE TABLE contact_segments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  filters JSONB NOT NULL,
  contact_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Templates
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  waba_id UUID REFERENCES waba_accounts(id) ON DELETE CASCADE,
  template_id_meta TEXT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  language TEXT DEFAULT 'en',
  status TEXT DEFAULT 'pending',
  components JSONB NOT NULL,
  rejection_reason TEXT,
  quality_score TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaigns
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  template_id UUID REFERENCES templates(id),
  phone_number_id UUID REFERENCES phone_numbers(id) ON DELETE SET NULL,
  audience_type TEXT DEFAULT 'all',
  segment_id UUID,
  contact_count INT DEFAULT 0,
  status TEXT DEFAULT 'draft',
  scheduled_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  sent_count INT DEFAULT 0,
  delivered_count INT DEFAULT 0,
  read_count INT DEFAULT 0,
  failed_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaign Messages
CREATE TABLE campaign_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id),
  message_id UUID UNIQUE,
  status TEXT DEFAULT 'pending',
  error_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversations
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  phone_number_id UUID REFERENCES phone_numbers(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES contacts(id),
  status TEXT DEFAULT 'open',
  assigned_to UUID,
  last_message_at TIMESTAMP WITH TIME ZONE NOT NULL,
  last_message_preview TEXT,
  unread_count INT DEFAULT 0,
  labels TEXT[] DEFAULT '{}',
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversation Notes
CREATE TABLE conversation_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Canned Responses
CREATE TABLE canned_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  shortcut TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, shortcut)
);

-- Labels
CREATE TABLE labels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#000000',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);

-- Flows (Chatbots)
CREATE TABLE flows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  phone_number_id UUID REFERENCES phone_numbers(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  trigger_type TEXT NOT NULL,
  trigger_value TEXT,
  nodes JSONB NOT NULL,
  edges JSONB NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Flow Sessions
CREATE TABLE flow_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  flow_id UUID REFERENCES flows(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id),
  current_node_id TEXT,
  variables JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active',
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE
);

-- Client Webhooks
CREATE TABLE client_webhooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  secret TEXT NOT NULL,
  events TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Webhook Logs
CREATE TABLE webhook_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  webhook_id UUID REFERENCES client_webhooks(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  response_status INT,
  response_body TEXT,
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  next_retry_at TIMESTAMP WITH TIME ZONE,
  attempt_count INT DEFAULT 0
);

-- Job Queue (backs async message/campaign/webhook sends - see apps/api/src/queue/index.ts)
CREATE TABLE job_queue (
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

CREATE INDEX idx_job_queue_claim ON job_queue (status, run_after, created_at)
  WHERE status = 'pending';

-- Media Files
CREATE TABLE media_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  original_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INT NOT NULL,
  s3_key TEXT NOT NULL,
  public_url TEXT,
  whatsapp_media_id TEXT,
  whatsapp_media_id_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Plans
CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  price_monthly FLOAT NOT NULL,
  price_yearly FLOAT NOT NULL,
  message_limit INT NOT NULL,
  contact_limit INT NOT NULL,
  agent_limit INT NOT NULL,
  features JSONB NOT NULL
);

-- Subscriptions
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES plans(id),
  status TEXT DEFAULT 'active',
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  cancel_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id)
);

-- Wallet Transactions
CREATE TABLE wallet_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  amount FLOAT NOT NULL,
  description TEXT NOT NULL,
  balance_after FLOAT NOT NULL,
  reference_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment Orders (Razorpay wallet top-ups, 1 INR = 1 credit)
CREATE TABLE payment_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  razorpay_order_id TEXT NOT NULL UNIQUE,
  razorpay_payment_id TEXT,
  amount FLOAT NOT NULL,
  credits FLOAT NOT NULL,
  status TEXT NOT NULL DEFAULT 'created',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE
);

-- Meta Event Logs (raw record of every webhook event Meta sends us -
-- message status updates, template status updates, quality updates, etc.
-- Distinct from client_webhooks/webhook_logs, which track OUR outbound
-- deliveries to customer-configured endpoints.)
CREATE TABLE meta_event_logs (
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

-- Invoices
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  amount FLOAT NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending',
  line_items JSONB NOT NULL,
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE,
  pdf_url TEXT
);

-- Tenant Settings
CREATE TABLE tenant_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
  business_name TEXT,
  business_email TEXT,
  business_phone TEXT,
  business_address TEXT,
  logo_url TEXT,
  notification_email BOOLEAN DEFAULT true,
  notification_sms BOOLEAN DEFAULT true,
  two_factor_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit Logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  metadata JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_messages_tenant ON messages(tenant_id);
CREATE INDEX idx_messages_phone ON messages(phone_number_id);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_contacts_tenant ON contacts(tenant_id);
CREATE INDEX idx_contacts_phone ON contacts(phone);
CREATE INDEX idx_conversations_tenant ON conversations(tenant_id);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_templates_tenant ON templates(tenant_id);
CREATE INDEX idx_campaigns_tenant ON campaigns(tenant_id);
CREATE INDEX idx_flows_tenant ON flows(tenant_id);
CREATE INDEX idx_payment_orders_tenant ON payment_orders(tenant_id);
CREATE INDEX idx_payment_orders_razorpay_order ON payment_orders(razorpay_order_id);
CREATE INDEX idx_meta_event_logs_tenant ON meta_event_logs(tenant_id);
CREATE INDEX idx_meta_event_logs_type ON meta_event_logs(event_type);
CREATE INDEX idx_meta_event_logs_received ON meta_event_logs(received_at DESC);

-- ============================================================
-- MIGRATION (run this against an already-provisioned database -
-- the CREATE TABLE statements above only apply on a fresh install)
-- ============================================================
-- ALTER TABLE phone_numbers ADD COLUMN IF NOT EXISTS messaging_limit TEXT;
-- ALTER TABLE templates ALTER COLUMN quality_score TYPE TEXT;
--
-- CREATE TABLE IF NOT EXISTS meta_event_logs (
--   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--   tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
--   event_type TEXT NOT NULL,
--   waba_id TEXT,
--   phone_number_id TEXT,
--   entity_id TEXT,
--   summary TEXT,
--   payload JSONB NOT NULL,
--   status TEXT DEFAULT 'processed',
--   error_message TEXT,
--   received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );
-- CREATE INDEX IF NOT EXISTS idx_meta_event_logs_tenant ON meta_event_logs(tenant_id);
-- CREATE INDEX IF NOT EXISTS idx_meta_event_logs_type ON meta_event_logs(event_type);
-- CREATE INDEX IF NOT EXISTS idx_meta_event_logs_received ON meta_event_logs(received_at DESC);

-- Insert default plans
INSERT INTO plans (name, price_monthly, price_yearly, message_limit, contact_limit, agent_limit, features) VALUES
('Free', 0, 0, 1000, 100, 1, '{"features": ["basic_analytics", "1_phone_number"]}'),
('Pro', 49, 470, 10000, 5000, 5, '{"features": ["advanced_analytics", "chatbot_builder", "5_phone_numbers"]}'),
('Enterprise', 199, 1900, -1, -1, -1, '{"features": ["unlimited", "priority_support", "custom_integrations"]}');

-- Enable Row Level Security (optional - for extra security)
-- ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- etc. for all tables

-- Create storage bucket for media
INSERT INTO storage.buckets (id, name, public) VALUES ('whatsapp-media', 'whatsapp-media', true);

-- Create storage policies for the bucket
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'whatsapp-media');
CREATE POLICY "Service Role Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'whatsapp-media');
CREATE POLICY "Service Role Delete" ON storage.objects FOR DELETE USING (bucket_id = 'whatsapp-media');