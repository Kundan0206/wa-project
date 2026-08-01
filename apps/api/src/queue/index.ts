import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { supabase } from '../lib/supabase.js';
import { sendWhatsAppMessage, sendTemplateMessage } from '../services/whatsapp.service.js';
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

interface FlowJob {
  contactId: string;
  flowId: string;
  message: string;
}

const redisUrl = process.env.REDIS_URL;

let connection: IORedis | null = null;
let messageQueue: Queue<MessageJob> | null = null;
let campaignQueue: Queue<CampaignJob> | null = null;
let webhookQueue: Queue<WebhookJob> | null = null;
let flowQueue: Queue<FlowJob> | null = null;

export let messageWorker: Worker<MessageJob> | { on: () => void; close: () => Promise<void> } = { on: () => {}, close: async () => {} };
export let campaignWorker: Worker<CampaignJob> | { on: () => void; close: () => Promise<void> } = { on: () => {}, close: async () => {} };
export let webhookWorker: Worker<WebhookJob> | { on: () => void; close: () => Promise<void> } = { on: () => {}, close: async () => {} };
export let flowWorker: Worker<FlowJob> | { on: () => void; close: () => Promise<void> } = { on: () => {}, close: async () => {} };

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

  const { data: contacts } = await supabase
    .from('contacts')
    .select('*')
    .eq('tenant_id', campaign.tenant_id)
    .eq('opted_in', true);

  let sent = 0;
  let failed = 0;

  for (const contact of contacts || []) {
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

export async function connectQueues() {
  if (!redisUrl) {
    console.log('Queue system: REDIS_URL not set, running in synchronous fallback mode');
    return;
  }

  connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });

  messageQueue = new Queue<MessageJob>('messages', { connection });
  campaignQueue = new Queue<CampaignJob>('campaigns', { connection });
  webhookQueue = new Queue<WebhookJob>('webhooks', { connection });
  flowQueue = new Queue<FlowJob>('flows', { connection });

  messageWorker = new Worker<MessageJob>('messages', (job: Job<MessageJob>) => processMessageJob(job.data), { connection });
  campaignWorker = new Worker<CampaignJob>('campaigns', (job: Job<CampaignJob>) => processCampaignJob(job.data), { connection });
  webhookWorker = new Worker<WebhookJob>('webhooks', (job: Job<WebhookJob>) => processWebhookJob(job.data), { connection });
  flowWorker = new Worker<FlowJob>('flows', async () => {}, { connection });

  messageWorker.on('failed', (job, err) => console.error(`[messages] job ${job?.id} failed:`, err.message));
  campaignWorker.on('failed', (job, err) => console.error(`[campaigns] job ${job?.id} failed:`, err.message));
  webhookWorker.on('failed', (job, err) => console.error(`[webhooks] job ${job?.id} failed:`, err.message));

  console.log('Queue system initialized (BullMQ + Redis)');
}

export async function addToMessageQueue(data: MessageJob) {
  if (messageQueue) {
    await messageQueue.add('send', data);
    return;
  }
  await processMessageJob(data);
}

export async function addCampaignJob(data: CampaignJob) {
  if (campaignQueue) {
    await campaignQueue.add('run', data);
    return;
  }
  await processCampaignJob(data);
}

export async function addWebhookJob(data: WebhookJob) {
  if (webhookQueue) {
    await webhookQueue.add('deliver', data);
    return;
  }
  await processWebhookJob(data);
}

export async function addFlowJob(data: FlowJob) {
  if (flowQueue) {
    await flowQueue.add('run', data);
  }
}
