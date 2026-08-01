import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest, asyncHandler } from '../middleware/auth.js';
import { io } from '../index.js';
import { addToMessageQueue } from '../queue/index.js';

const router = Router();

router.get('/', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const supabase = req.supabase!;
  const { status, assigned_to, label, page = '1', limit = '20' } = req.query;

  let query = supabase
    .from('conversations')
    .select('*, contacts(*), phone_numbers(*), assigned_to_user:users(id, name, avatar_url)', { count: 'exact' })
    .eq('tenant_id', req.tenantId);

  if (status) query = query.eq('status', status);
  if (assigned_to === 'unassigned') query = query.is('assigned_to', null);
  else if (assigned_to) query = query.eq('assigned_to', assigned_to);

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const { data: conversations, error } = await query
    .order('last_message_at', { ascending: false })
    .range(skip, skip + parseInt(limit as string) - 1);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({ success: true, data: conversations || [] });
}));

router.get('/:id', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const supabase = req.supabase!;
  const { id } = req.params;

  const { data: conversation, error } = await supabase
    .from('conversations')
    .select('*, contacts(*), phone_numbers(*), conversation_notes(*, users:user_id(id, name))')
    .eq('id', id)
    .eq('tenant_id', req.tenantId)
    .single();

  if (error || !conversation) {
    res.status(404).json({ error: 'Conversation not found' });
    return;
  }

  res.json({ success: true, data: conversation });
}));

router.post('/:id/assign', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { assigned_to } = req.body;
  const supabase = req.supabase!;
  const { id } = req.params;

  const { data: conversation, error } = await supabase
    .from('conversations')
    .update({ assigned_to: assigned_to || null })
    .eq('id', id)
    .eq('tenant_id', req.tenantId)
    .select()
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  io.to(`tenant:${req.tenantId}:conversation:${id}`).emit('conversation_assigned', { conversationId: id, assignedTo: assigned_to });

  res.json({ success: true, data: conversation });
}));

router.post('/:id/resolve', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const supabase = req.supabase!;
  const { id } = req.params;

  const { data: conversation, error } = await supabase
    .from('conversations')
    .update({ status: 'resolved', resolved_at: new Date().toISOString() })
    .eq('id', id)
    .eq('tenant_id', req.tenantId)
    .select()
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  io.to(`tenant:${req.tenantId}:conversation:${id}`).emit('conversation_resolved', { conversationId: id });

  res.json({ success: true, data: conversation });
}));

router.post('/:id/send', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { message, type = 'text' } = req.body;
  const supabase = req.supabase!;
  const { id } = req.params;

  const { data: conversation } = await supabase
    .from('conversations')
    .select('*, contacts(*), phone_numbers(*, waba_accounts(*))')
    .eq('id', id)
    .eq('tenant_id', req.tenantId)
    .single();

  if (!conversation) {
    res.status(404).json({ error: 'Conversation not found' });
    return;
  }

  const { data: msg, error } = await supabase
    .from('messages')
    .insert({
      tenant_id: req.tenantId!,
      phone_number_id: conversation.phone_number_id,
      conversation_id: id,
      contact_id: conversation.contact_id,
      direction: 'outbound',
      recipient: conversation.contacts.phone,
      sender: conversation.phone_numbers.display_number,
      type: type as string,
      content: message,
      status: 'queued'
    })
    .select()
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  await addToMessageQueue({
    messageId: msg.id,
    type: 'text',
    to: conversation.contacts.phone,
    phoneNumberId: conversation.phone_numbers.phone_number_id,
    wabaId: conversation.phone_numbers.waba_accounts.waba_id,
    accessToken: conversation.phone_numbers.waba_accounts.access_token,
    content: message
  });

  io.to(`tenant:${req.tenantId}:conversation:${id}`).emit('new_message', msg);

  res.status(201).json({ success: true, data: msg });
}));

export default router;