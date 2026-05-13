import { Router, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { authenticate, AuthRequest, requireRole, asyncHandler } from '../middleware/auth.js';
import { addWebhookJob } from '../queue/index.js';

const router = Router();

router.get('/', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const supabase = req.supabase!;

  const { data: webhooks, error } = await supabase
    .from('client_webhooks')
    .select('*')
    .eq('tenant_id', req.tenantId)
    .order('created_at', { ascending: false });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({ success: true, data: webhooks || [] });
}));

const createWebhookSchema = z.object({
  url: z.string().url(),
  events: z.array(z.string()).min(1)
});

router.post('/', authenticate, requireRole('owner', 'admin'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = createWebhookSchema.parse(req.body);
  const supabase = req.supabase!;

  const secret = uuidv4();

  const { data: webhook, error } = await supabase
    .from('client_webhooks')
    .insert({
      tenant_id: req.tenantId!,
      url: data.url,
      secret,
      events: data.events,
      is_active: true
    })
    .select()
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.status(201).json({ success: true, data: { ...webhook, secret } });
}));

router.delete('/:id', authenticate, requireRole('owner', 'admin'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const supabase = req.supabase!;
  const { id } = req.params;

  const { error } = await supabase
    .from('client_webhooks')
    .delete()
    .eq('id', id)
    .eq('tenant_id', req.tenantId);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({ success: true, message: 'Webhook deleted' });
}));

router.post('/:id/test', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const supabase = req.supabase!;
  const { id } = req.params;

  await addWebhookJob({
    webhookId: id,
    eventType: 'message.received',
    payload: { test: true, timestamp: new Date().toISOString() }
  });

  res.json({ success: true, message: 'Test event queued' });
}));

export default router;