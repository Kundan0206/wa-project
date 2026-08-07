import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest, asyncHandler } from '../middleware/auth.js';
import { sendWhatsAppMessage, sendTemplateMessage, markMessageAsRead } from '../services/whatsapp.service.js';
import { addToMessageQueue } from '../queue/index.js';

const router = Router();

const textMessageSchema = z.object({
  to: z.string().regex(/^\+?[1-9]\d{1,14}$/),
  phone_number_id: z.string(),
  message: z.string().max(4096)
});

router.post('/text', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = textMessageSchema.parse(req.body);
  const supabase = req.supabase!;

  const { data: phone } = await supabase
    .from('phone_numbers')
    .select('*, waba_accounts(*)')
    .eq('phone_number_id', data.phone_number_id)
    .eq('tenant_id', req.tenantId)
    .single();

  if (!phone) {
    res.status(404).json({ error: 'Phone number not found' });
    return;
  }

  if (phone.status === 'deregistered') {
    res.status(400).json({ error: 'This phone number is deregistered and cannot send messages' });
    return;
  }

  const { data: message, error: msgError } = await supabase
    .from('messages')
    .insert({
      tenant_id: req.tenantId!,
      phone_number_id: phone.id,
      direction: 'outbound',
      recipient: data.to,
      sender: phone.display_number,
      type: 'text',
      content: data.message,
      status: 'queued'
    })
    .select()
    .single();

  if (msgError) {
    res.status(500).json({ error: msgError.message });
    return;
  }

  await addToMessageQueue({
    messageId: message.id,
    type: 'text',
    to: data.to,
    phoneNumberId: phone.phone_number_id,
    wabaId: phone.waba_accounts.waba_id,
    accessToken: phone.waba_accounts.access_token,
    content: data.message
  });

  res.status(202).json({ success: true, data: { id: message.id, status: message.status } });
}));

const templateMessageSchema = z.object({
  to: z.string().regex(/^\+?[1-9]\d{1,14}$/),
  phone_number_id: z.string(),
  template_name: z.string(),
  language_code: z.string().default('en'),
  components: z.array(z.any()).optional()
});

router.post('/template', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = templateMessageSchema.parse(req.body);
  const supabase = req.supabase!;

  const { data: phone } = await supabase
    .from('phone_numbers')
    .select('*, waba_accounts(*), templates(*)')
    .eq('phone_number_id', data.phone_number_id)
    .eq('tenant_id', req.tenantId)
    .single();

  if (!phone) {
    res.status(404).json({ error: 'Phone number not found' });
    return;
  }

  if (phone.status === 'deregistered') {
    res.status(400).json({ error: 'This phone number is deregistered and cannot send messages' });
    return;
  }

  const template = phone.templates?.find((t: any) => t.name === data.template_name);

  const { data: message, error: msgError } = await supabase
    .from('messages')
    .insert({
      tenant_id: req.tenantId!,
      phone_number_id: phone.id,
      direction: 'outbound',
      recipient: data.to,
      sender: phone.display_number,
      type: 'template',
      content: JSON.stringify({ template_name: data.template_name, components: data.components }),
      template_id: template?.id,
      status: 'queued'
    })
    .select()
    .single();

  if (msgError) {
    res.status(500).json({ error: msgError.message });
    return;
  }

  await addToMessageQueue({
    messageId: message.id,
    type: 'template',
    to: data.to,
    phoneNumberId: phone.phone_number_id,
    wabaId: phone.waba_accounts.waba_id,
    accessToken: phone.waba_accounts.access_token,
    templateName: data.template_name,
    languageCode: data.language_code,
    components: data.components
  });

  res.status(202).json({ success: true, data: { id: message.id, status: message.status } });
}));

router.get('/:id', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const supabase = req.supabase!;
  const { id } = req.params;

  const { data: message, error } = await supabase
    .from('messages')
    .select('*, phone_numbers(*)')
    .eq('id', id)
    .eq('tenant_id', req.tenantId)
    .single();

  if (error || !message) {
    res.status(404).json({ error: 'Message not found' });
    return;
  }

  res.json({ success: true, data: message });
}));

router.get('/', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const supabase = req.supabase!;
  const { contact, conversation, status, type, page = '1', limit = '20' } = req.query;

  let query = supabase
    .from('messages')
    .select('*, phone_numbers(*)', { count: 'exact' })
    .eq('tenant_id', req.tenantId);

  if (contact) query = query.eq('contact_id', contact);
  if (conversation) query = query.eq('conversation_id', conversation);
  if (status) query = query.eq('status', status);
  if (type) query = query.eq('type', type);

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  // Conversation threads read oldest-first (like a chat); other listings
  // (e.g. a flat message log) stay newest-first.
  const { data: messages, error } = await query
    .order('created_at', { ascending: !!conversation })
    .range(skip, skip + parseInt(limit as string) - 1);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  const { count } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', req.tenantId);

  res.json({
    success: true,
    data: messages || [],
    pagination: {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total: count || 0,
      totalPages: Math.ceil((count || 0) / parseInt(limit as string))
    }
  });
}));

router.post('/mark-read', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { message_id } = req.body;
  const supabase = req.supabase!;

  const { data: message } = await supabase
    .from('messages')
    .select('*, phone_numbers(*, waba_accounts(*))')
    .eq('wamid', message_id)
    .eq('tenant_id', req.tenantId)
    .single();

  if (!message) {
    res.status(404).json({ error: 'Message not found' });
    return;
  }

  await markMessageAsRead(
    message.phone_numbers.waba_accounts.access_token,
    message.phone_numbers.phone_number_id,
    message.wamid!
  );

  await supabase
    .from('messages')
    .update({ status: 'read', read_at: new Date().toISOString() })
    .eq('id', message.id);

  res.json({ success: true });
}));

export default router;