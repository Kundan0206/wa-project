import { supabase } from '../lib/supabase.js';
import { io } from '../index.js';
import { toCamelCase } from '../middleware/camelCase.js';
import { findMatchingFlow, runFlow } from './flow.service.js';

let supabaseInstance: any = null;

function getSupabase(): any {
  if (!supabaseInstance) {
    supabaseInstance = supabase;
  }
  return supabaseInstance;
}

interface WebhookEvent {
  phoneNumberId?: string;
  message?: any;
  contacts?: any[];
  status?: any;
  field?: string;
  wabaId?: string;
  value?: any;
}

export async function processWebhookEvent(event: WebhookEvent) {
  const db = getSupabase();

  try {
    if (event.status) {
      await handleStatusUpdate(event.status, db);
    }

    if (event.message) {
      await handleIncomingMessage(event.message, event.contacts, event.phoneNumberId, db);
    }

    if (event.field === 'message_template_status_update') {
      await handleTemplateStatusUpdate(event.value, db);
    } else if (event.field === 'phone_number_quality_update') {
      await handlePhoneQualityUpdate(event.value, db);
    } else if (event.field === 'message_template_quality_update') {
      await handleTemplateQualityUpdate(event.value, db);
    }
  } catch (error) {
    console.error('Error processing webhook event:', error);
  }
}

interface LogMetaEventInput {
  eventType: string;
  wabaId?: string;
  phoneNumberId?: string;
  entityId?: string;
  payload: any;
  tenantId?: string;
  summary?: string;
  status?: 'processed' | 'error' | 'ignored';
  errorMessage?: string;
}

// Records every Meta webhook event we receive, regardless of whether we have
// business logic for it yet, so the Logs page shows a full audit trail
// (template status, delivery status, quality updates, etc.) rather than
// only the subset we act on.
export async function logMetaEvent(input: LogMetaEventInput) {
  const db = getSupabase();

  try {
    let tenantId = input.tenantId;

    if (!tenantId && input.wabaId) {
      const { data: waba } = await db
        .from('waba_accounts')
        .select('tenant_id')
        .eq('waba_id', input.wabaId)
        .single();
      tenantId = waba?.tenant_id;
    }

    if (!tenantId && input.phoneNumberId) {
      const { data: phone } = await db
        .from('phone_numbers')
        .select('tenant_id')
        .eq('phone_number_id', input.phoneNumberId)
        .single();
      tenantId = phone?.tenant_id;
    }

    if (!tenantId) return;

    await db.from('meta_event_logs').insert({
      tenant_id: tenantId,
      event_type: input.eventType,
      waba_id: input.wabaId,
      phone_number_id: input.phoneNumberId,
      entity_id: input.entityId,
      summary: input.summary,
      payload: input.payload,
      status: input.status || 'processed',
      error_message: input.errorMessage
    });
  } catch (err: any) {
    console.error('Failed to record meta event log:', err.message);
  }
}

async function handleTemplateStatusUpdate(value: any, db: any) {
  const { message_template_id, message_template_name, event, reason } = value;

  if (!message_template_id) return;

  const newStatus = String(event || '').toLowerCase();

  await db
    .from('templates')
    .update({
      status: newStatus,
      rejection_reason: reason || null
    })
    .eq('template_id_meta', String(message_template_id));

  const { data: template } = await db
    .from('templates')
    .select('id, tenant_id')
    .eq('template_id_meta', String(message_template_id))
    .single();

  if (template) {
    io.to(`tenant:${template.tenant_id}`).emit('template_status_updated', {
      templateId: template.id,
      name: message_template_name,
      status: newStatus,
      reason
    });
  }
}

async function handleTemplateQualityUpdate(value: any, db: any) {
  const { message_template_id, new_quality_score } = value;
  if (!message_template_id) return;

  await db
    .from('templates')
    .update({ quality_score: new_quality_score })
    .eq('template_id_meta', String(message_template_id));
}

async function handlePhoneQualityUpdate(value: any, db: any) {
  const { display_phone_number, current_limit, event } = value;
  if (!display_phone_number) return;

  await db
    .from('phone_numbers')
    .update({
      quality_rating: event,
      messaging_limit: current_limit
    })
    .eq('display_number', display_phone_number);
}

async function handleStatusUpdate(status: any, db: any) {
  const { id, status: messageStatus, timestamp } = status;

  const updateData: any = {
    status: mapStatus(messageStatus)
  };

  if (messageStatus === 'delivered') {
    updateData.delivered_at = new Date(timestamp).toISOString();
  } else if (messageStatus === 'read') {
    updateData.read_at = new Date(timestamp).toISOString();
  } else if (messageStatus === 'failed') {
    updateData.failed_at = new Date(timestamp).toISOString();
    updateData.error_code = status.errors?.[0]?.code;
    updateData.error_message = status.errors?.[0]?.message;
  }

  await db
    .from('messages')
    .update(updateData)
    .eq('wamid', id);

  const { data: message } = await db
    .from('messages')
    .select('*, conversation:conversations(*)')
    .eq('wamid', id)
    .single();

  if (message?.conversation_id) {
    io.to(`tenant:${message.tenant_id}:conversation:${message.conversation_id}`).emit('message_status_updated', {
      messageId: message.id,
      status: messageStatus
    });
  }

  if (message?.campaign_id) {
    await updateCampaignMessageStatus(message.campaign_id, message.id, messageStatus, db);
  }
}

async function updateCampaignMessageStatus(campaignId: string, messageId: string, messageStatus: string, db: any) {
  const mappedStatus = mapStatus(messageStatus);

  await db
    .from('campaign_messages')
    .update({ status: mappedStatus, updated_at: new Date().toISOString() })
    .eq('campaign_id', campaignId)
    .eq('message_id', messageId);

  // Recompute rollup counters from campaign_messages rather than
  // incrementing in place, since Meta can redeliver the same status event
  // and incrementing would double-count.
  const { data: rows } = await db
    .from('campaign_messages')
    .select('status')
    .eq('campaign_id', campaignId);

  const counts = { sent: 0, delivered: 0, read: 0, failed: 0 };
  for (const row of rows || []) {
    if (row.status === 'delivered') counts.delivered++;
    else if (row.status === 'read') counts.read++;
    else if (row.status === 'failed') counts.failed++;
    if (row.status !== 'failed') counts.sent++;
  }

  const { data: campaign } = await db
    .from('campaigns')
    .update({
      sent_count: counts.sent,
      delivered_count: counts.delivered,
      read_count: counts.read,
      failed_count: counts.failed
    })
    .eq('id', campaignId)
    .select('tenant_id')
    .single();

  if (campaign) {
    io.to(`tenant:${campaign.tenant_id}`).emit('campaign_progress', {
      campaignId,
      ...counts
    });
  }
}

async function handleIncomingMessage(message: any, contacts: any[] = [], phoneNumberId: string | undefined, db: any) {
  const { data: phone } = await db
    .from('phone_numbers')
    .select('*, waba_accounts(*)')
    .eq('phone_number_id', phoneNumberId)
    .single();

  if (!phone) {
    console.error('Phone number not found:', phoneNumberId);
    return;
  }

  const from = message.from;

  const { data: existingContact } = await db
    .from('contacts')
    .select('*')
    .eq('tenant_id', phone.tenant_id)
    .eq('phone', from)
    .single();

  let contact = existingContact;

  if (!contact) {
    const contactData = contacts?.[0];
    const { data: newContact } = await db
      .from('contacts')
      .insert({
        tenant_id: phone.tenant_id,
        phone: from,
        name: contactData?.profile?.name,
        opted_in: true,
        opted_in_at: new Date().toISOString()
      })
      .select()
      .single();
    contact = newContact;
  } else {
    await db
      .from('contacts')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', contact.id);
  }

  const messageContent = extractMessageContent(message);

  const { data: newMessage } = await db
    .from('messages')
    .insert({
      tenant_id: phone.tenant_id,
      phone_number_id: phone.id,
      wamid: message.id,
      direction: 'inbound',
      recipient: phone.display_number,
      sender: from,
      type: message.type,
      content: messageContent,
      status: 'received',
      contact_id: contact?.id
    })
    .select()
    .single();

  const { data: existingConv } = await db
    .from('conversations')
    .select('*')
    .eq('tenant_id', phone.tenant_id)
    .eq('phone_number_id', phone.id)
    .eq('contact_id', contact?.id)
    .in('status', ['open', 'pending'])
    .single();

  let conversation = existingConv;

  if (!conversation) {
    const { data: newConv } = await db
      .from('conversations')
      .insert({
        tenant_id: phone.tenant_id,
        phone_number_id: phone.id,
        contact_id: contact?.id,
        status: 'open',
        last_message_at: new Date().toISOString(),
        last_message_preview: messageContent?.substring(0, 100)
      })
      .select()
      .single();
    conversation = newConv;
  } else {
    await db
      .from('conversations')
      .update({
        last_message_at: new Date().toISOString(),
        last_message_preview: messageContent?.substring(0, 100),
        unread_count: conversation.unread_count + 1
      })
      .eq('id', conversation.id);
  }

  if (newMessage && conversation) {
    await db
      .from('messages')
      .update({ conversation_id: conversation.id })
      .eq('id', newMessage.id);
  }

  if (conversation) {
    io.to(`tenant:${phone.tenant_id}:conversation:${conversation.id}`).emit('new_message', toCamelCase(newMessage));
    io.to(`tenant:${phone.tenant_id}`).emit('conversation_update', {
      conversationId: conversation.id,
      lastMessage: messageContent?.substring(0, 50)
    });
  }

  if (contact) {
    try {
      const flow = await findMatchingFlow(db, phone.id, contact.id, messageContent);
      if (flow) {
        await runFlow({ db, flow, phone, contact, incomingText: messageContent });
      }
    } catch (err: any) {
      console.error('Flow execution failed:', err.message);
    }
  }
}

function extractMessageContent(message: any): string {
  switch (message.type) {
    case 'text':
      return message.text?.body;
    case 'image':
      return message.image?.caption || '[Image]';
    case 'video':
      return message.video?.caption || '[Video]';
    case 'audio':
      return '[Audio]';
    case 'document':
      return message.document?.filename || '[Document]';
    case 'location':
      return `[Location: ${message.location?.latitude}, ${message.location?.longitude}]`;
    case 'contacts':
      return '[Contacts]';
    case 'sticker':
      return '[Sticker]';
    case 'reaction':
      return `[Reaction: ${message.reaction?.emoji || '👍'}]`;
    case 'interactive':
      if (message.interactive?.type === 'button_reply') {
        return message.interactive.button_reply?.title;
      } else if (message.interactive?.type === 'list_reply') {
        return message.interactive.list_reply?.title;
      }
      return '[Interactive]';
    default:
      return JSON.stringify(message);
  }
}

function mapStatus(status: string): string {
  const mapping: Record<string, string> = {
    sent: 'sent',
    delivered: 'delivered',
    read: 'read',
    failed: 'failed',
    pending: 'queued'
  };
  return mapping[status] || 'unknown';
}