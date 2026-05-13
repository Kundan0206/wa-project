import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config.js';

if (!config.supabaseServiceKey) {
  throw new Error('SUPABASE_SERVICE_KEY is required. Check .env file.');
}

// Disable realtime to avoid WebSocket issues in Node 20
const globalAny = global as any;
if (!globalAny.WebSocket) {
  const ws = require('ws');
  globalAny.WebSocket = ws;
}

export const supabase: SupabaseClient = createClient(config.supabaseUrl, config.supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
} as any);

export function getSupabaseWithAuth(token: string): SupabaseClient {
  return createClient(config.supabaseUrl, config.supabaseServiceKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export type Database = {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string;
          name: string;
          slug: string;
          plan: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          plan?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          plan?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          tenant_id: string;
          email: string;
          password_hash: string;
          role: string;
          name: string;
          avatar_url: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          email: string;
          password_hash: string;
          role?: string;
          name: string;
          avatar_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          email?: string;
          password_hash?: string;
          role?: string;
          name?: string;
          avatar_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      api_keys: {
        Row: {
          id: string;
          tenant_id: string;
          name: string;
          key_hash: string;
          prefix: string;
          scopes: string[];
          last_used_at: string | null;
          expires_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          name: string;
          key_hash: string;
          prefix: string;
          scopes?: string[];
          last_used_at?: string | null;
          expires_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          name?: string;
          key_hash?: string;
          prefix?: string;
          scopes?: string[];
          last_used_at?: string | null;
          expires_at?: string | null;
          created_at?: string;
        };
      };
      waba_accounts: {
        Row: {
          id: string;
          tenant_id: string;
          waba_id: string;
          waba_name: string;
          access_token: string;
          status: string;
          currency: string;
          timezone: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          waba_id: string;
          waba_name: string;
          access_token: string;
          status?: string;
          currency?: string;
          timezone?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          waba_id?: string;
          waba_name?: string;
          access_token?: string;
          status?: string;
          currency?: string;
          timezone?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      phone_numbers: {
        Row: {
          id: string;
          tenant_id: string;
          waba_id: string;
          phone_number_id: string;
          display_number: string;
          display_name: string;
          quality_rating: string | null;
          status: string;
          is_default: boolean;
          webhook_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          waba_id: string;
          phone_number_id: string;
          display_number: string;
          display_name: string;
          quality_rating?: string | null;
          status?: string;
          is_default?: boolean;
          webhook_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          waba_id?: string;
          phone_number_id?: string;
          display_number?: string;
          display_name?: string;
          quality_rating?: string | null;
          status?: string;
          is_default?: boolean;
          webhook_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          tenant_id: string;
          phone_number_id: string;
          wamid: string | null;
          direction: string;
          recipient: string;
          sender: string;
          type: string;
          content: string | null;
          status: string;
          template_id: string | null;
          campaign_id: string | null;
          conversation_id: string | null;
          contact_id: string | null;
          sent_at: string | null;
          delivered_at: string | null;
          read_at: string | null;
          failed_at: string | null;
          error_code: string | null;
          error_message: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          phone_number_id: string;
          wamid?: string | null;
          direction: string;
          to: string;
          from: string;
          type: string;
          content?: string | null;
          status?: string;
          template_id?: string | null;
          campaign_id?: string | null;
          conversation_id?: string | null;
          contact_id?: string | null;
          sent_at?: string | null;
          delivered_at?: string | null;
          read_at?: string | null;
          failed_at?: string | null;
          error_code?: string | null;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          phone_number_id?: string;
          wamid?: string | null;
          direction?: string;
          to?: string;
          from?: string;
          type?: string;
          content?: string | null;
          status?: string;
          template_id?: string | null;
          campaign_id?: string | null;
          conversation_id?: string | null;
          contact_id?: string | null;
          sent_at?: string | null;
          delivered_at?: string | null;
          read_at?: string | null;
          failed_at?: string | null;
          error_code?: string | null;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      contacts: {
        Row: {
          id: string;
          tenant_id: string;
          phone: string;
          name: string | null;
          email: string | null;
          country_code: string | null;
          language: string;
          custom_fields: Record<string, unknown> | null;
          opted_in: boolean;
          opted_in_at: string | null;
          opted_out_at: string | null;
          last_message_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          phone: string;
          name?: string | null;
          email?: string | null;
          country_code?: string | null;
          language?: string;
          custom_fields?: Record<string, unknown> | null;
          opted_in?: boolean;
          opted_in_at?: string | null;
          opted_out_at?: string | null;
          last_message_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          phone?: string;
          name?: string | null;
          email?: string | null;
          country_code?: string | null;
          language?: string;
          custom_fields?: Record<string, unknown> | null;
          opted_in?: boolean;
          opted_in_at?: string | null;
          opted_out_at?: string | null;
          last_message_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      contact_tags: {
        Row: {
          id: string;
          tenant_id: string;
          contact_id: string;
          tag: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          contact_id: string;
          tag: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          contact_id?: string;
          tag?: string;
          created_at?: string;
        };
      };
      contact_segments: {
        Row: {
          id: string;
          tenant_id: string;
          name: string;
          filters: Record<string, unknown>;
          contact_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          name: string;
          filters: Record<string, unknown>;
          contact_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          name?: string;
          filters?: Record<string, unknown>;
          contact_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      templates: {
        Row: {
          id: string;
          tenant_id: string;
          waba_id: string;
          template_id_meta: string | null;
          name: string;
          category: string;
          language: string;
          status: string;
          components: Record<string, unknown>;
          rejection_reason: string | null;
          quality_score: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          waba_id: string;
          template_id_meta?: string | null;
          name: string;
          category: string;
          language?: string;
          status?: string;
          components: Record<string, unknown>;
          rejection_reason?: string | null;
          quality_score?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          waba_id?: string;
          template_id_meta?: string | null;
          name?: string;
          category?: string;
          language?: string;
          status?: string;
          components?: Record<string, unknown>;
          rejection_reason?: string | null;
          quality_score?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      campaigns: {
        Row: {
          id: string;
          tenant_id: string;
          name: string;
          template_id: string;
          phone_number_id: string;
          audience_type: string;
          segment_id: string | null;
          contact_count: number;
          status: string;
          scheduled_at: string | null;
          started_at: string | null;
          completed_at: string | null;
          sent_count: number;
          delivered_count: number;
          read_count: number;
          failed_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          name: string;
          template_id: string;
          phone_number_id: string;
          audience_type?: string;
          segment_id?: string | null;
          contact_count?: number;
          status?: string;
          scheduled_at?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          sent_count?: number;
          delivered_count?: number;
          read_count?: number;
          failed_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          name?: string;
          template_id?: string;
          phone_number_id?: string;
          audience_type?: string;
          segment_id?: string | null;
          contact_count?: number;
          status?: string;
          scheduled_at?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          sent_count?: number;
          delivered_count?: number;
          read_count?: number;
          failed_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      campaign_messages: {
        Row: {
          id: string;
          campaign_id: string;
          contact_id: string;
          message_id: string | null;
          status: string;
          error_code: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          contact_id: string;
          message_id?: string | null;
          status?: string;
          error_code?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          campaign_id?: string;
          contact_id?: string;
          message_id?: string | null;
          status?: string;
          error_code?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      conversations: {
        Row: {
          id: string;
          tenant_id: string;
          phone_number_id: string;
          contact_id: string;
          status: string;
          assigned_to: string | null;
          last_message_at: string;
          last_message_preview: string | null;
          unread_count: number;
          labels: string[];
          resolved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          phone_number_id: string;
          contact_id: string;
          status?: string;
          assigned_to?: string | null;
          last_message_at: string;
          last_message_preview?: string | null;
          unread_count?: number;
          labels?: string[];
          resolved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          phone_number_id?: string;
          contact_id?: string;
          status?: string;
          assigned_to?: string | null;
          last_message_at?: string;
          last_message_preview?: string | null;
          unread_count?: number;
          labels?: string[];
          resolved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      conversation_notes: {
        Row: {
          id: string;
          conversation_id: string;
          user_id: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          user_id: string;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          user_id?: string;
          content?: string;
          created_at?: string;
        };
      };
      canned_responses: {
        Row: {
          id: string;
          tenant_id: string;
          shortcut: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          shortcut: string;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          shortcut?: string;
          content?: string;
          created_at?: string;
        };
      };
      labels: {
        Row: {
          id: string;
          tenant_id: string;
          name: string;
          color: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          name: string;
          color?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          name?: string;
          color?: string;
          created_at?: string;
        };
      };
      flows: {
        Row: {
          id: string;
          tenant_id: string;
          phone_number_id: string;
          name: string;
          trigger_type: string;
          trigger_value: string | null;
          nodes: Record<string, unknown>;
          edges: Record<string, unknown>;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          phone_number_id: string;
          name: string;
          trigger_type: string;
          trigger_value?: string | null;
          nodes: Record<string, unknown>;
          edges: Record<string, unknown>;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          phone_number_id?: string;
          name?: string;
          trigger_type?: string;
          trigger_value?: string | null;
          nodes?: Record<string, unknown>;
          edges?: Record<string, unknown>;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      flow_sessions: {
        Row: {
          id: string;
          flow_id: string;
          contact_id: string;
          current_node_id: string | null;
          variables: Record<string, unknown>;
          status: string;
          started_at: string;
          ended_at: string | null;
        };
        Insert: {
          id?: string;
          flow_id: string;
          contact_id: string;
          current_node_id?: string | null;
          variables?: Record<string, unknown>;
          status?: string;
          started_at?: string;
          ended_at?: string | null;
        };
        Update: {
          id?: string;
          flow_id?: string;
          contact_id?: string;
          current_node_id?: string | null;
          variables?: Record<string, unknown>;
          status?: string;
          started_at?: string;
          ended_at?: string | null;
        };
      };
      client_webhooks: {
        Row: {
          id: string;
          tenant_id: string;
          url: string;
          secret: string;
          events: string[];
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          url: string;
          secret: string;
          events?: string[];
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          url?: string;
          secret?: string;
          events?: string[];
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      webhook_logs: {
        Row: {
          id: string;
          webhook_id: string;
          event_type: string;
          payload: Record<string, unknown>;
          response_status: number | null;
          response_body: string | null;
          attempted_at: string;
          next_retry_at: string | null;
          attempt_count: number;
        };
        Insert: {
          id?: string;
          webhook_id: string;
          event_type: string;
          payload: Record<string, unknown>;
          response_status?: number | null;
          response_body?: string | null;
          attempted_at?: string;
          next_retry_at?: string | null;
          attempt_count?: number;
        };
        Update: {
          id?: string;
          webhook_id?: string;
          event_type?: string;
          payload?: Record<string, unknown>;
          response_status?: number | null;
          response_body?: string | null;
          attempted_at?: string;
          next_retry_at?: string | null;
          attempt_count?: number;
        };
      };
      media_files: {
        Row: {
          id: string;
          tenant_id: string;
          original_name: string;
          file_type: string;
          mime_type: string;
          size_bytes: number;
          s3_key: string;
          public_url: string | null;
          whatsapp_media_id: string | null;
          whatsapp_media_id_expires_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          original_name: string;
          file_type: string;
          mime_type: string;
          size_bytes: number;
          s3_key: string;
          public_url?: string | null;
          whatsapp_media_id?: string | null;
          whatsapp_media_id_expires_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          original_name?: string;
          file_type?: string;
          mime_type?: string;
          size_bytes?: number;
          s3_key?: string;
          public_url?: string | null;
          whatsapp_media_id?: string | null;
          whatsapp_media_id_expires_at?: string | null;
          created_at?: string;
        };
      };
      plans: {
        Row: {
          id: string;
          name: string;
          price_monthly: number;
          price_yearly: number;
          message_limit: number;
          contact_limit: number;
          agent_limit: number;
          features: Record<string, unknown>;
        };
        Insert: {
          id?: string;
          name: string;
          price_monthly: number;
          price_yearly: number;
          message_limit: number;
          contact_limit: number;
          agent_limit: number;
          features: Record<string, unknown>;
        };
        Update: {
          id?: string;
          name?: string;
          price_monthly?: number;
          price_yearly?: number;
          message_limit?: number;
          contact_limit?: number;
          agent_limit?: number;
          features?: Record<string, unknown>;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          tenant_id: string;
          plan_id: string;
          status: string;
          current_period_start: string;
          current_period_end: string;
          cancel_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          plan_id: string;
          status?: string;
          current_period_start: string;
          current_period_end: string;
          cancel_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          plan_id?: string;
          status?: string;
          current_period_start?: string;
          current_period_end?: string;
          cancel_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      wallet_transactions: {
        Row: {
          id: string;
          tenant_id: string;
          type: string;
          amount: number;
          description: string;
          balance_after: number;
          reference_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          type: string;
          amount: number;
          description: string;
          balance_after: number;
          reference_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          type?: string;
          amount?: number;
          description?: string;
          balance_after?: number;
          reference_id?: string | null;
          created_at?: string;
        };
      };
      invoices: {
        Row: {
          id: string;
          tenant_id: string;
          amount: number;
          currency: string;
          status: string;
          line_items: Record<string, unknown>;
          issued_at: string;
          paid_at: string | null;
          pdf_url: string | null;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          amount: number;
          currency?: string;
          status?: string;
          line_items: Record<string, unknown>;
          issued_at?: string;
          paid_at?: string | null;
          pdf_url?: string | null;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          amount?: number;
          currency?: string;
          status?: string;
          line_items?: Record<string, unknown>;
          issued_at?: string;
          paid_at?: string | null;
          pdf_url?: string | null;
        };
      };
      tenant_settings: {
        Row: {
          id: string;
          tenant_id: string;
          business_name: string | null;
          business_email: string | null;
          business_phone: string | null;
          business_address: string | null;
          logo_url: string | null;
          notification_email: boolean;
          notification_sms: boolean;
          two_factor_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          business_name?: string | null;
          business_email?: string | null;
          business_phone?: string | null;
          business_address?: string | null;
          logo_url?: string | null;
          notification_email?: boolean;
          notification_sms?: boolean;
          two_factor_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          business_name?: string | null;
          business_email?: string | null;
          business_phone?: string | null;
          business_address?: string | null;
          logo_url?: string | null;
          notification_email?: boolean;
          notification_sms?: boolean;
          two_factor_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          tenant_id: string;
          user_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          metadata: Record<string, unknown> | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          user_id?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          metadata?: Record<string, unknown> | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          user_id?: string | null;
          action?: string;
          entity_type?: string;
          entity_id?: string | null;
          metadata?: Record<string, unknown> | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
      };
    };
  };
};

export type Tables = Database['public']['Tables'];
export type Tenant = Tables['tenants']['Row'];
export type User = Tables['users']['Row'];
export type ApiKey = Tables['api_keys']['Row'];
export type WabaAccount = Tables['waba_accounts']['Row'];
export type PhoneNumber = Tables['phone_numbers']['Row'];
export type Message = Tables['messages']['Row'];
export type Contact = Tables['contacts']['Row'];
export type ContactTag = Tables['contact_tags']['Row'];
export type ContactSegment = Tables['contact_segments']['Row'];
export type Template = Tables['templates']['Row'];
export type Campaign = Tables['campaigns']['Row'];
export type CampaignMessage = Tables['campaign_messages']['Row'];
export type Conversation = Tables['conversations']['Row'];
export type ConversationNote = Tables['conversation_notes']['Row'];
export type CannedResponse = Tables['canned_responses']['Row'];
export type Label = Tables['labels']['Row'];
export type Flow = Tables['flows']['Row'];
export type FlowSession = Tables['flow_sessions']['Row'];
export type ClientWebhook = Tables['client_webhooks']['Row'];
export type WebhookLog = Tables['webhook_logs']['Row'];
export type MediaFile = Tables['media_files']['Row'];
export type Plan = Tables['plans']['Row'];
export type Subscription = Tables['subscriptions']['Row'];
export type WalletTransaction = Tables['wallet_transactions']['Row'];
export type Invoice = Tables['invoices']['Row'];
export type TenantSettings = Tables['tenant_settings']['Row'];
export type AuditLog = Tables['audit_logs']['Row'];