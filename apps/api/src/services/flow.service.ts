import { sendWhatsAppMessage, sendTemplateMessage } from './whatsapp.service.js';

interface FlowNode {
  id: string;
  type: string;
  data: Record<string, any>;
}

interface FlowEdge {
  id: string;
  source: string;
  target: string;
}

interface RunContext {
  db: any;
  flow: any;
  phone: any;
  contact: any;
  incomingText: string;
}

/**
 * Finds the first active flow on this phone number whose trigger matches the
 * incoming message. keyword_match requires the message text to contain the
 * configured keyword (case-insensitive); first_message only fires when the
 * contact has no prior inbound messages; any_message always matches.
 */
export async function findMatchingFlow(db: any, phoneId: string, contactId: string, incomingText: string) {
  const { data: flows } = await db
    .from('flows')
    .select('*')
    .eq('phone_number_id', phoneId)
    .eq('is_active', true);

  if (!flows || flows.length === 0) return null;

  for (const flow of flows) {
    if (flow.trigger_type === 'any_message') return flow;

    if (flow.trigger_type === 'keyword_match' && flow.trigger_value) {
      if (incomingText?.toLowerCase().includes(flow.trigger_value.toLowerCase())) return flow;
    }

    if (flow.trigger_type === 'first_message') {
      const { count } = await db
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('contact_id', contactId)
        .eq('direction', 'inbound');
      // count includes the message that just triggered this check.
      if ((count || 0) <= 1) return flow;
    }
  }

  return null;
}

/**
 * Runs a flow's nodes in sequence starting from the trigger, executing each
 * step (send a message, tag the contact, wait, or stop) until it reaches an
 * `end` node or runs out of nodes. Persists a flow_sessions row so the run
 * is visible in the Flows analytics view.
 */
export async function runFlow(ctx: RunContext) {
  const { db, flow, phone, contact } = ctx;
  const nodes: FlowNode[] = flow.nodes || [];
  const edges: FlowEdge[] = flow.edges || [];

  if (nodes.length === 0) return;

  const { data: session } = await db
    .from('flow_sessions')
    .insert({
      flow_id: flow.id,
      contact_id: contact.id,
      status: 'active',
      current_node_id: nodes[0].id
    })
    .select()
    .single();

  let current: FlowNode | undefined = nodes[0];
  const visited = new Set<string>();
  let failureReason: string | null = null;

  while (current && !visited.has(current.id)) {
    visited.add(current.id);

    try {
      await executeNode(current, ctx);
    } catch (err: any) {
      failureReason = `Step "${current.type}" (${current.id}) failed: ${err.message}`;
      console.error(`Flow ${flow.id} node ${current.id} failed:`, err.message);
      break;
    }

    if (current.type === 'end') break;

    const nextEdge = edges.find((e) => e.source === current!.id);
    current = nextEdge ? nodes.find((n) => n.id === nextEdge.target) : undefined;

    if (session && current) {
      await db.from('flow_sessions').update({ current_node_id: current.id }).eq('id', session.id);
    }
  }

  if (session) {
    await db
      .from('flow_sessions')
      .update({
        status: failureReason ? 'failed' : 'completed',
        error_message: failureReason,
        ended_at: new Date().toISOString()
      })
      .eq('id', session.id);
  }
}

async function executeNode(node: FlowNode, ctx: RunContext) {
  const { db, phone, contact } = ctx;
  const accessToken = phone.waba_accounts?.access_token;

  switch (node.type) {
    case 'send_text': {
      const text = String(node.data?.text || '').trim();
      if (!text) throw new Error('Message text is empty');
      if (!accessToken) throw new Error('No WhatsApp access token for this phone number (WABA may be disconnected)');
      await sendWhatsAppMessage(accessToken, phone.phone_number_id, contact.phone, {
        type: 'text',
        text: { body: text }
      });
      const { error } = await db.from('messages').insert({
        tenant_id: phone.tenant_id,
        phone_number_id: phone.id,
        contact_id: contact.id,
        direction: 'outbound',
        recipient: contact.phone,
        sender: phone.display_number,
        type: 'text',
        content: text,
        status: 'sent'
      });
      if (error) throw new Error(`Message sent but failed to record locally: ${error.message}`);
      break;
    }

    case 'send_template': {
      const templateName = String(node.data?.templateName || '');
      const languageCode = String(node.data?.languageCode || 'en');
      if (!templateName) throw new Error('No template selected for this step');
      if (!accessToken) throw new Error('No WhatsApp access token for this phone number (WABA may be disconnected)');
      await sendTemplateMessage(accessToken, phone.phone_number_id, contact.phone, templateName, languageCode);
      const { error } = await db.from('messages').insert({
        tenant_id: phone.tenant_id,
        phone_number_id: phone.id,
        contact_id: contact.id,
        direction: 'outbound',
        recipient: contact.phone,
        sender: phone.display_number,
        type: 'template',
        content: JSON.stringify({ template_name: templateName }),
        status: 'sent'
      });
      if (error) throw new Error(`Template sent but failed to record locally: ${error.message}`);
      break;
    }

    case 'add_tag': {
      const tag = String(node.data?.tag || '').trim();
      if (!tag) throw new Error('No tag name provided for this step');
      const { error } = await db.from('contact_tags').insert({ tenant_id: phone.tenant_id, contact_id: contact.id, tag });
      // A duplicate tag (the contact already has it) is not a real failure.
      if (error && error.code !== '23505') throw new Error(`Failed to add tag: ${error.message}`);
      break;
    }

    case 'delay': {
      const seconds = Math.min(Number(node.data?.seconds) || 0, 30);
      if (seconds > 0) await new Promise((resolve) => setTimeout(resolve, seconds * 1000));
      break;
    }

    case 'end':
    default:
      break;
  }
}
