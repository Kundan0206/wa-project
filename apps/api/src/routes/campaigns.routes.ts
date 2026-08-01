import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest, requireRole, asyncHandler } from '../middleware/auth.js';
import { addCampaignJob } from '../queue/index.js';

const router = Router();

router.get('/', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const supabase = req.supabase!;
  const { status, page = '1', limit = '20' } = req.query;

  let query = supabase
    .from('campaigns')
    .select('*, templates(*), phone_numbers(*)', { count: 'exact' })
    .eq('tenant_id', req.tenantId);

  if (status) query = query.eq('status', status);

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const { data: campaigns, error } = await query
    .order('created_at', { ascending: false })
    .range(skip, skip + parseInt(limit as string) - 1);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  const { count } = await supabase
    .from('campaigns')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', req.tenantId);

  res.json({
    success: true,
    data: campaigns || [],
    pagination: {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total: count || 0,
      totalPages: Math.ceil((count || 0) / parseInt(limit as string))
    }
  });
}));

const createCampaignSchema = z.object({
  name: z.string().min(1),
  template_id: z.string(),
  phone_number_id: z.string(),
  audience_type: z.enum(['all', 'segment', 'custom']),
  segment_id: z.string().optional(),
  contact_ids: z.array(z.string()).optional(),
  scheduled_at: z.string().datetime().optional()
});

router.post('/', authenticate, requireRole('owner', 'admin'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = createCampaignSchema.parse(req.body);
  const supabase = req.supabase!;

  const [{ data: template }, { data: phoneNumber }] = await Promise.all([
    supabase.from('templates').select('*').eq('id', data.template_id).eq('tenant_id', req.tenantId).single(),
    supabase.from('phone_numbers').select('*').eq('id', data.phone_number_id).eq('tenant_id', req.tenantId).single()
  ]);

  if (!template || !phoneNumber) {
    res.status(404).json({ error: 'Template or phone number not found' });
    return;
  }

  let contactCount = 0;

  if (data.audience_type === 'all') {
    const { count } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', req.tenantId)
      .eq('opted_in', true);
    contactCount = count || 0;
  } else if (data.audience_type === 'segment' && data.segment_id) {
    const { data: segment } = await supabase
      .from('contact_segments')
      .select('contact_count')
      .eq('id', data.segment_id)
      .eq('tenant_id', req.tenantId)
      .single();

    if (!segment) {
      res.status(404).json({ error: 'Segment not found' });
      return;
    }

    contactCount = segment.contact_count || 0;
  } else if (data.audience_type === 'custom' && data.contact_ids) {
    contactCount = data.contact_ids.length;
  }

  const { data: campaign, error } = await supabase
    .from('campaigns')
    .insert({
      tenant_id: req.tenantId!,
      name: data.name,
      template_id: data.template_id,
      phone_number_id: data.phone_number_id,
      audience_type: data.audience_type,
      segment_id: data.segment_id,
      contact_count: contactCount,
      status: data.scheduled_at ? 'scheduled' : 'draft',
      scheduled_at: data.scheduled_at ? new Date(data.scheduled_at).toISOString() : null
    })
    .select()
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.status(201).json({ success: true, data: campaign });
}));

router.get('/:id', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const supabase = req.supabase!;
  const { id } = req.params;

  const { data: campaign, error } = await supabase
    .from('campaigns')
    .select('*, templates(*), phone_numbers(*)')
    .eq('id', id)
    .eq('tenant_id', req.tenantId)
    .single();

  if (error || !campaign) {
    res.status(404).json({ error: 'Campaign not found' });
    return;
  }

  res.json({ success: true, data: campaign });
}));

router.post('/:id/send', authenticate, requireRole('owner', 'admin'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const supabase = req.supabase!;
  const { id } = req.params;

  const { data: campaign } = await supabase
    .from('campaigns')
    .select('*, templates(*), phone_numbers(*, waba_accounts(*))')
    .eq('id', id)
    .eq('tenant_id', req.tenantId)
    .single();

  if (!campaign) {
    res.status(404).json({ error: 'Campaign not found' });
    return;
  }

  if (campaign.status !== 'draft' && campaign.status !== 'scheduled') {
    res.status(400).json({ error: 'Campaign cannot be sent in current status' });
    return;
  }

  await supabase
    .from('campaigns')
    .update({ status: 'running', started_at: new Date().toISOString() })
    .eq('id', id);

  await addCampaignJob({ campaignId: campaign.id });

  res.json({ success: true, message: 'Campaign started' });
}));

router.delete('/:id', authenticate, requireRole('owner', 'admin'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const supabase = req.supabase!;
  const { id } = req.params;

  const { error } = await supabase
    .from('campaigns')
    .delete()
    .eq('id', id)
    .eq('tenant_id', req.tenantId);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({ success: true, message: 'Campaign deleted' });
}));

router.get('/:id/analytics', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const supabase = req.supabase!;
  const { id } = req.params;

  const { data: campaign } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', req.tenantId)
    .single();

  if (!campaign) {
    res.status(404).json({ error: 'Campaign not found' });
    return;
  }

  res.json({
    success: true,
    data: {
      sent: campaign.sent_count,
      delivered: campaign.delivered_count,
      read: campaign.read_count,
      failed: campaign.failed_count,
      deliveryRate: campaign.sent_count > 0 ? (campaign.delivered_count / campaign.sent_count * 100).toFixed(2) : '0',
      readRate: campaign.delivered_count > 0 ? (campaign.read_count / campaign.delivered_count * 100).toFixed(2) : '0'
    }
  });
}));

export default router;