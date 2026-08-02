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

  const { data: webhook } = await supabase
    .from('client_webhooks')
    .select('id')
    .eq('id', id)
    .eq('tenant_id', req.tenantId)
    .single();

  if (!webhook) {
    res.status(404).json({ error: 'Webhook not found' });
    return;
  }

  await addWebhookJob({
    webhookId: id,
    eventType: 'message.received',
    payload: { test: true, timestamp: new Date().toISOString() }
  });

  res.json({ success: true, message: 'Test event queued' });
}));

router.get('/meta-events', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const supabase = req.supabase!;
  const { eventType, status, page = '1', limit = '25' } = req.query;

  let query = supabase
    .from('meta_event_logs')
    .select('*', { count: 'exact' })
    .eq('tenant_id', req.tenantId);

  if (eventType) query = query.eq('event_type', eventType);
  if (status) query = query.eq('status', status);

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const { data: logs, error, count } = await query
    .order('received_at', { ascending: false })
    .range(skip, skip + limitNum - 1);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({
    success: true,
    data: logs || [],
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limitNum)
    }
  });
}));

router.get('/logs', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const supabase = req.supabase!;
  const { page = '1', limit = '20' } = req.query;

  const { data: webhooks } = await supabase
    .from('client_webhooks')
    .select('id, url')
    .eq('tenant_id', req.tenantId);

  const webhookIds = (webhooks || []).map((w) => w.id);

  if (webhookIds.length === 0) {
    res.json({ success: true, data: [], pagination: { page: 1, limit: parseInt(limit as string), total: 0, totalPages: 0 } });
    return;
  }

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const { data: logs, error, count } = await supabase
    .from('webhook_logs')
    .select('*', { count: 'exact' })
    .in('webhook_id', webhookIds)
    .order('attempted_at', { ascending: false })
    .range(skip, skip + parseInt(limit as string) - 1);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  const urlById = new Map((webhooks || []).map((w) => [w.id, w.url]));
  const enriched = (logs || []).map((log) => ({ ...log, webhook_url: urlById.get(log.webhook_id) }));

  res.json({
    success: true,
    data: enriched,
    pagination: {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total: count || 0,
      totalPages: Math.ceil((count || 0) / parseInt(limit as string))
    }
  });
}));

export default router;