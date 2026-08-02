import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest, requireRole, asyncHandler } from '../middleware/auth.js';
import { createTemplate, deleteTemplate, syncTemplateFromMeta, listTemplatesFromMeta } from '../services/whatsapp.service.js';

// Never select access_token in responses that go back to the browser.
const WABA_SAFE_COLUMNS = 'id, tenant_id, waba_id, waba_name, status, currency, timezone, created_at, updated_at';

const router = Router();

const createTemplateSchema = z.object({
  name: z.string().min(1),
  category: z.enum(['marketing', 'utility', 'authentication']),
  language: z.string().default('en'),
  components: z.array(z.any()).min(1)
});

const syncFromMetaSchema = z.object({
  phoneNumberId: z.string().uuid()
});

// Pulls the full template list from Meta for the WABA behind a given
// connected phone number and upserts it locally by template_id_meta - picks
// up templates created directly in Meta Business Manager (never seen by
// this app before) as well as refreshing status/quality/rejection reason
// for templates we already know about, all in one pass.
router.post('/sync-from-meta', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = syncFromMetaSchema.parse(req.body);
  const supabase = req.supabase!;

  const { data: phoneNumber } = await supabase
    .from('phone_numbers')
    .select('id, waba_id, waba_accounts(waba_id, access_token)')
    .eq('id', data.phoneNumberId)
    .eq('tenant_id', req.tenantId)
    .single();

  if (!phoneNumber) {
    res.status(404).json({ error: 'Phone number not found' });
    return;
  }

  const waba = phoneNumber.waba_accounts as any;
  if (!waba?.access_token || !waba?.waba_id) {
    res.status(400).json({ error: 'No connected WhatsApp Business Account for this number' });
    return;
  }

  let metaTemplates;
  try {
    metaTemplates = await listTemplatesFromMeta(waba.access_token, waba.waba_id);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to fetch templates from Meta' });
    return;
  }

  let created = 0;
  let updated = 0;

  for (const t of metaTemplates) {
    const { data: existing } = await supabase
      .from('templates')
      .select('id')
      .eq('tenant_id', req.tenantId)
      .eq('template_id_meta', t.id)
      .single();

    if (existing) {
      await supabase
        .from('templates')
        .update({
          status: t.status,
          quality_score: t.qualityScore || null,
          rejection_reason: t.rejectionReason || null,
          components: t.components
        })
        .eq('id', existing.id);
      updated++;
    } else {
      await supabase
        .from('templates')
        .insert({
          tenant_id: req.tenantId!,
          waba_id: phoneNumber.waba_id,
          template_id_meta: t.id,
          name: t.name,
          category: t.category,
          language: t.language,
          components: t.components,
          status: t.status,
          quality_score: t.qualityScore || null,
          rejection_reason: t.rejectionReason || null
        });
      created++;
    }
  }

  res.json({
    success: true,
    data: { total: metaTemplates.length, created, updated }
  });
}));

router.get('/', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const supabase = req.supabase!;
  const { status, category, page = '1', limit = '20' } = req.query;

  let query = supabase
    .from('templates')
    .select(`*, waba_accounts(${WABA_SAFE_COLUMNS})`, { count: 'exact' })
    .eq('tenant_id', req.tenantId);

  if (status) query = query.eq('status', status);
  if (category) query = query.eq('category', category);

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const { data: templates, error } = await query
    .order('created_at', { ascending: false })
    .range(skip, skip + parseInt(limit as string) - 1);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  const { count } = await supabase
    .from('templates')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', req.tenantId);

  res.json({
    success: true,
    data: templates || [],
    pagination: {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total: count || 0,
      totalPages: Math.ceil((count || 0) / parseInt(limit as string))
    }
  });
}));

router.get('/:id', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const supabase = req.supabase!;
  const { id } = req.params;

  const { data: template, error } = await supabase
    .from('templates')
    .select(`*, waba_accounts(${WABA_SAFE_COLUMNS})`)
    .eq('id', id)
    .eq('tenant_id', req.tenantId)
    .single();

  if (error || !template) {
    res.status(404).json({ error: 'Template not found' });
    return;
  }

  res.json({ success: true, data: template });
}));

router.post('/', authenticate, requireRole('owner', 'admin'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = createTemplateSchema.parse(req.body);
  const supabase = req.supabase!;

  const { data: waba } = await supabase
    .from('waba_accounts')
    .select('*')
    .eq('tenant_id', req.tenantId)
    .eq('status', 'active')
    .single();

  if (!waba) {
    res.status(400).json({ error: 'No active WABA account found' });
    return;
  }

  let metaTemplateId: string | undefined;

  try {
    const metaResult = await createTemplate(waba.access_token, waba.waba_id, {
      name: data.name,
      category: data.category.toUpperCase(),
      language: data.language,
      components: data.components
    });
    metaTemplateId = (metaResult as any).id;
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to submit template to Meta' });
    return;
  }

  const { data: template, error } = await supabase
    .from('templates')
    .insert({
      tenant_id: req.tenantId!,
      waba_id: waba.id,
      template_id_meta: metaTemplateId,
      name: data.name,
      category: data.category,
      language: data.language,
      components: data.components,
      status: 'pending'
    })
    .select()
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.status(201).json({ success: true, data: template });
}));

router.delete('/:id', authenticate, requireRole('owner', 'admin'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const supabase = req.supabase!;
  const { id } = req.params;

  const { data: template } = await supabase
    .from('templates')
    .select('template_id_meta, waba_accounts(access_token)')
    .eq('id', id)
    .eq('tenant_id', req.tenantId)
    .single();

  if (!template) {
    res.status(404).json({ error: 'Template not found' });
    return;
  }

  const metaTemplateId = template.template_id_meta;
  const accessToken = (template.waba_accounts as any)?.access_token;

  if (metaTemplateId && accessToken) {
    try {
      await deleteTemplate(accessToken, metaTemplateId);
    } catch (err: any) {
      // If Meta already doesn't have it (e.g. previously deleted there),
      // don't block removing our local record too.
      console.warn('Failed to delete template on Meta, removing local record anyway:', err.message);
    }
  }

  const { error } = await supabase
    .from('templates')
    .delete()
    .eq('id', id)
    .eq('tenant_id', req.tenantId);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({ success: true, message: 'Template deleted' });
}));

router.post('/:id/sync', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const supabase = req.supabase!;
  const { id } = req.params;

  const { data: template } = await supabase
    .from('templates')
    .select('template_id_meta, waba_accounts(access_token)')
    .eq('id', id)
    .eq('tenant_id', req.tenantId)
    .single();

  if (!template || !template.template_id_meta) {
    res.status(404).json({ error: 'Template not found' });
    return;
  }

  const accessToken = (template.waba_accounts as any)?.access_token;
  if (!accessToken) {
    res.status(400).json({ error: 'No connected WhatsApp account for this template' });
    return;
  }

  try {
    const synced = await syncTemplateFromMeta(accessToken, template.template_id_meta);

    const { data: updated, error } = await supabase
      .from('templates')
      .update({
        status: synced.status,
        quality_score: synced.qualityScore || null,
        rejection_reason: synced.rejectionReason || null
      })
      .eq('id', id)
      .eq('tenant_id', req.tenantId)
      .select()
      .single();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to sync template from Meta' });
  }
}));

router.get('/:id/analytics', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const supabase = req.supabase!;
  const { id } = req.params;

  const { data: template } = await supabase
    .from('templates')
    .select('id')
    .eq('id', id)
    .eq('tenant_id', req.tenantId)
    .single();

  if (!template) {
    res.status(404).json({ error: 'Template not found' });
    return;
  }

  const { count: sent } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('template_id', id)
    .eq('tenant_id', req.tenantId)
    .in('status', ['sent', 'delivered', 'read']);

  const { count: delivered } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('template_id', id)
    .eq('tenant_id', req.tenantId)
    .in('status', ['delivered', 'read']);

  const { count: read } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('template_id', id)
    .eq('tenant_id', req.tenantId)
    .eq('status', 'read');

  res.json({
    success: true,
    data: {
      sent: sent || 0,
      delivered: delivered || 0,
      read: read || 0,
      deliveryRate: sent ? ((delivered || 0) / sent * 100).toFixed(2) : '0',
      readRate: delivered ? ((read || 0) / delivered * 100).toFixed(2) : '0'
    }
  });
}));

export default router;