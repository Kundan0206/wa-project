import { supabase } from '../lib/supabase.js';
import { sendWhatsAppMessage, sendTemplateMessage } from '../services/whatsapp.service.js';
import { resolveSegmentContacts } from '../services/segment.service.js';
import { io } from '../index.js';

interface MessageJob {
  messageId: string;
  type: string;
  to: string;
  phoneNumberId: string;
  wabaId: string;
  accessToken: string;
  content?: string;
  templateName?: string;
  languageCode?: string;
  components?: any[];
}

interface CampaignJob {
  campaignId: string;
}

interface WebhookJob {
  webhookId: string;
  eventType: string;
  payload: any;
}

type JobType = 'message' | 'campaign' | 'webhook';

interface QueuedJob {
  id: string;
  job_type: JobType;
  payload: MessageJob | CampaignJob | WebhookJob;
  attempts: number;
  max_attempts: number;
}

async function processMessageJob(data: MessageJob) {
  const { data: message } = await supabase
    .from('messages')
    .select('*, conversation:conversations(*)')
    .eq('id', data.messageId)
    .single();

  try {
    let result: any;

    if (data.type === 'template' && data.templateName) {
      result = await sendTemplateMessage(
        data.accessToken,
        data.phoneNumberId,
        data.to,
        data.templateName,
        data.languageCode || 'en',
        data.components
      );
    } else {
      result = await sendWhatsAppMessage(data.accessToken, data.phoneNumberId, data.to, {
        type: 'text',
        text: { body: data.content }
      });
    }

    const wamid: string | undefined = result?.messages?.[0]?.id;

    await supabase
      .from('messages')
      .update({ status: 'sent', wamid, sent_at: new Date().toISOString() })
      .eq('id', data.messageId);

    if (message?.tenant_id && message?.conversation_id) {
      io.to(`tenant:${message.tenant_id}:conversation:${message.conversation_id}`).emit('message_status_updated', {
        messageId: data.messageId,
        status: 'sent'
      });
    }
  } catch (error: any) {
    await supabase
      .from('messages')
      .update({
        status: 'failed',
        failed_at: new Date().toISOString(),
        error_message: error.message
      })
      .eq('id', data.messageId);

    if (message?.tenant_id && message?.conversation_id) {
      io.to(`tenant:${message.tenant_id}:conversation:${message.conversation_id}`).emit('message_status_updated', {
        messageId: data.messageId,
        status: 'failed',
        error: error.message
      });
    }

    throw error;
  }
}

async function processCampaignJob(data: CampaignJob) {
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('*, templates(*), phone_numbers(*, waba_accounts(*))')
    .eq('id', data.campaignId)
    .single();

  if (!campaign) return;

  if (!campaign.phone_numbers || campaign.phone_numbers.status === 'deregistered') {
    await supabase
      .from('campaigns')
      .update({ status: 'failed' })
      .eq('id', campaign.id);
    return;
  }

  let contacts: any[] = [];

  if (campaign.audience_type === 'segment' && campaign.segment_id) {
    const { data: segment } = await supabase
      .from('contact_segments')
      .select('filters')
      .eq('id', campaign.segment_id)
      .single();
    const matched = segment ? await resolveSegmentContacts(supabase, campaign.tenant_id, segment.filters) : [];
    contacts = matched.filter((c) => c.opted_in);
  } else {
    const { data } = await supabase
      .from('contacts')
      .select('*')
      .eq('tenant_id', campaign.tenant_id)
      .eq('opted_in', true);
    contacts = data || [];
  }

  let sent = 0;
  let failed = 0;

  for (const contact of contacts) {
    try {
      const { data: message } = await supabase
        .from('messages')
        .insert({
          tenant_id: campaign.tenant_id,
          phone_number_id: campaign.phone_number_id,
          campaign_id: campaign.id,
          contact_id: contact.id,
          direction: 'outbound',
          recipient: contact.phone,
          sender: campaign.phone_numbers.display_number,
          type: 'template',
          content: JSON.stringify({ template_name: campaign.templates.name }),
          template_id: campaign.template_id,
          status: 'queued'
        })
        .select()
        .single();

      await sendTemplateMessage(
        campaign.phone_numbers.waba_accounts.access_token,
        campaign.phone_numbers.phone_number_id,
        contact.phone,
        campaign.templates.name,
        campaign.templates.language || 'en'
      );

      await supabase
        .from('messages')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', message.id);

      await supabase
        .from('campaign_messages')
        .insert({ campaign_id: campaign.id, contact_id: contact.id, message_id: message.id, status: 'sent' });

      sent++;
    } catch (err: any) {
      await supabase
        .from('campaign_messages')
        .insert({ campaign_id: campaign.id, contact_id: contact.id, status: 'failed', error_code: err.message });
      failed++;
    }
  }

  await supabase
    .from('campaigns')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      sent_count: sent,
      failed_count: failed
    })
    .eq('id', campaign.id);
}

async function processWebhookJob(data: WebhookJob) {
  const { data: webhook } = await supabase
    .from('client_webhooks')
    .select('*')
    .eq('id', data.webhookId)
    .single();

  if (!webhook || !webhook.is_active) return;

  const crypto = await import('crypto');
  const payload = JSON.stringify(data.payload);
  const signature = crypto
    .createHmac('sha256', webhook.secret)
    .update(payload)
    .digest('hex');

  try {
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': `sha256=${signature}`,
        'X-Webhook-Event': data.eventType
      },
      body: payload
    });

    await supabase.from('webhook_logs').insert({
      webhook_id: webhook.id,
      event_type: data.eventType,
      payload: data.payload,
      response_status: response.status,
      response_body: (await response.text()).slice(0, 2000)
    });
  } catch (err: any) {
    await supabase.from('webhook_logs').insert({
      webhook_id: webhook.id,
      event_type: data.eventType,
      payload: data.payload,
      response_status: null,
      response_body: err.message
    });
  }
}

const PROCESSORS: Record<JobType, (payload: any) => Promise<void>> = {
  message: processMessageJob,
  campaign: processCampaignJob,
  webhook: processWebhookJob
};

const POLL_INTERVAL_MS = 2000;
const BATCH_SIZE = 10;
const RETRY_BACKOFF_MS = 30_000;

let pollTimer: NodeJS.Timeout | null = null;
let polling = false;

async function claimJobs(): Promise<QueuedJob[]> {
  const { data: candidates } = await supabase
    .from('job_queue')
    .select('id')
    .eq('status', 'pending')
    .lte('run_after', new Date().toISOString())
    .order('created_at', { ascending: true })
    .limit(BATCH_SIZE);

  if (!candidates || candidates.length === 0) return [];

  const { data: claimed } = await supabase
    .from('job_queue')
    .update({ status: 'processing', updated_at: new Date().toISOString() })
    .in('id', candidates.map((c) => c.id))
    .eq('status', 'pending')
    .select('id, job_type, payload, attempts, max_attempts');

  return (claimed || []) as QueuedJob[];
}

async function runJob(job: QueuedJob) {
  try {
    await PROCESSORS[job.job_type](job.payload);
    await supabase
      .from('job_queue')
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('id', job.id);
  } catch (error: any) {
    const attempts = job.attempts + 1;
    const willRetry = attempts < job.max_attempts;

    await supabase
      .from('job_queue')
      .update({
        status: willRetry ? 'pending' : 'failed',
        attempts,
        last_error: error.message?.slice(0, 2000) || 'Unknown error',
        run_after: new Date(Date.now() + RETRY_BACKOFF_MS * attempts).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', job.id);

    console.error(`[job_queue] ${job.job_type} job ${job.id} failed (attempt ${attempts}/${job.max_attempts}):`, error.message);
  }
}

async function poll() {
  if (polling) return;
  polling = true;
  try {
    const jobs = await claimJobs();
    if (jobs.length > 0) {
      await Promise.all(jobs.map(runJob));
    }
  } catch (error: any) {
    console.error('[job_queue] poll failed:', error.message);
  } finally {
    polling = false;
  }
}

export async function connectQueues() {
  if (pollTimer) return;
  pollTimer = setInterval(poll, POLL_INTERVAL_MS);
  void poll();
  console.log('Queue system initialized (Supabase-backed job_queue, polling every %dms)', POLL_INTERVAL_MS);
}

export async function stopQueues() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

async function enqueue(jobType: JobType, payload: MessageJob | CampaignJob | WebhookJob) {
  const { error } = await supabase.from('job_queue').insert({ job_type: jobType, payload });
  if (error) throw new Error(`Failed to enqueue ${jobType} job: ${error.message}`);
}

export async function addToMessageQueue(data: MessageJob) {
  await enqueue('message', data);
}

export async function addCampaignJob(data: CampaignJob) {
  await enqueue('campaign', data);
}

export async function addWebhookJob(data: WebhookJob) {
  await enqueue('webhook', data);
}
