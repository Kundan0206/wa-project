import { supabase } from '../lib/supabase.js';
import { io } from '../index.js';

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
  } catch (error) {
    console.error('Error processing webhook event:', error);
  }
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
}

async function handleIncomingMessage(message: any, contacts: any[], phoneNumberId: string | undefined, db: any) {
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
    io.to(`tenant:${phone.tenant_id}:conversation:${conversation.id}`).emit('new_message', newMessage);
    io.to(`tenant:${phone.tenant_id}`).emit('conversation_update', {
      conversationId: conversation.id,
      lastMessage: messageContent?.substring(0, 50)
    });
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