import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest, asyncHandler } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const supabase = req.supabase!;
  const { search, tags, opted_in, page = '1', limit = '20' } = req.query;

  let query = supabase
    .from('contacts')
    .select('*', { count: 'exact' })
    .eq('tenant_id', req.tenantId);

  if (search) {
    // Escape PostgREST filter syntax (`,`, `(`, `)`) and ilike wildcards
    // (`%`, `_`) so user input can't inject additional filter clauses.
    const safeSearch = String(search)
      .replace(/[\\%_]/g, '\\$&')
      .replace(/[,()]/g, '');
    query = query.or(`phone.ilike.%${safeSearch}%,name.ilike.%${safeSearch}%,email.ilike.%${safeSearch}%`);
  }

  if (opted_in !== undefined) {
    query = query.eq('opted_in', opted_in === 'true');
  }

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const { data: contacts, error } = await query
    .order('created_at', { ascending: false })
    .range(skip, skip + parseInt(limit as string) - 1);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  const { count } = await supabase
    .from('contacts')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', req.tenantId);

  res.json({
    success: true,
    data: contacts || [],
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

  const { data: contact, error } = await supabase
    .from('contacts')
    .select('*, contact_tags(*)')
    .eq('id', id)
    .eq('tenant_id', req.tenantId)
    .single();

  if (error || !contact) {
    res.status(404).json({ error: 'Contact not found' });
    return;
  }

  res.json({ success: true, data: { ...contact, tags: contact.contact_tags?.map((t: any) => t.tag) } });
}));

const createContactSchema = z.object({
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/),
  name: z.string().optional(),
  email: z.string().email().optional(),
  country_code: z.string().optional(),
  language: z.string().optional(),
  custom_fields: z.record(z.any()).optional(),
  tags: z.array(z.string()).optional(),
  opted_in: z.boolean().default(false)
});

router.post('/', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = createContactSchema.parse(req.body);
  const supabase = req.supabase!;

  const { data: existing } = await supabase
    .from('contacts')
    .select('id')
    .eq('tenant_id', req.tenantId)
    .eq('phone', data.phone)
    .single();

  if (existing) {
    const { data: updated, error } = await supabase
      .from('contacts')
      .update({
        name: data.name,
        email: data.email,
        custom_fields: data.custom_fields,
        ...(data.opted_in && { opted_in: true, opted_in_at: new Date().toISOString() })
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({ success: true, data: updated, message: 'Contact updated' });
    return;
  }

  const { data: contact, error } = await supabase
    .from('contacts')
    .insert({
      tenant_id: req.tenantId!,
      phone: data.phone,
      name: data.name,
      email: data.email,
      country_code: data.country_code,
      language: data.language || 'en',
      custom_fields: data.custom_fields,
      opted_in: data.opted_in,
      opted_in_at: data.opted_in ? new Date().toISOString() : null
    })
    .select()
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  if (data.tags && data.tags.length > 0) {
    const tagInserts = data.tags.map(tag => ({
      tenant_id: req.tenantId!,
      contact_id: contact.id,
      tag
    }));

    await supabase.from('contact_tags').insert(tagInserts);
  }

  res.status(201).json({ success: true, data: contact });
}));

router.put('/:id', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = createContactSchema.partial().parse(req.body);
  const supabase = req.supabase!;
  const { id } = req.params;

  const { data: contact, error } = await supabase
    .from('contacts')
    .update({
      ...(data.name && { name: data.name }),
      ...(data.email && { email: data.email }),
      ...(data.custom_fields && { custom_fields: data.custom_fields })
    })
    .eq('id', id)
    .eq('tenant_id', req.tenantId)
    .select()
    .single();

  if (error || !contact) {
    res.status(404).json({ error: 'Contact not found' });
    return;
  }

  res.json({ success: true, data: contact });
}));

router.delete('/:id', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const supabase = req.supabase!;
  const { id } = req.params;

  const { error } = await supabase
    .from('contacts')
    .delete()
    .eq('id', id)
    .eq('tenant_id', req.tenantId);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({ success: true, message: 'Contact deleted' });
}));

router.post('/import', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { contacts } = req.body;
  const supabase = req.supabase!;

  if (!Array.isArray(contacts)) {
    res.status(400).json({ error: 'Contacts must be an array' });
    return;
  }

  const created = [];

  for (const c of contacts) {
    const { data: existing } = await supabase
      .from('contacts')
      .select('id')
      .eq('tenant_id', req.tenantId)
      .eq('phone', c.phone)
      .single();

    if (existing) continue;

    const { data: contact } = await supabase
      .from('contacts')
      .insert({
        tenant_id: req.tenantId!,
        phone: c.phone,
        name: c.name,
        email: c.email,
        language: c.language || 'en'
      })
      .select()
      .single();

    if (contact) created.push(contact);
  }

  res.status(201).json({ success: true, data: { imported: created.length } });
}));

router.post('/opt-out/:phone', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const supabase = req.supabase!;
  const { phone } = req.params;

  const { error } = await supabase
    .from('contacts')
    .update({ opted_in: false, opted_out_at: new Date().toISOString() })
    .eq('tenant_id', req.tenantId)
    .eq('phone', phone);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({ success: true, message: 'Contact opted out' });
}));

export default router;