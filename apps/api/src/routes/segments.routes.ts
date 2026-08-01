import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest, asyncHandler } from '../middleware/auth.js';
import { resolveSegmentContacts } from '../services/segment.service.js';

const router = Router();

router.get('/', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const supabase = req.supabase!;

  const { data: segments, error } = await supabase
    .from('contact_segments')
    .select('*')
    .eq('tenant_id', req.tenantId)
    .order('created_at', { ascending: false });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({ success: true, data: segments || [] });
}));

const createSegmentSchema = z.object({
  name: z.string().min(1),
  filters: z.array(z.any()).min(1)
});

router.post('/', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = createSegmentSchema.parse(req.body);
  const supabase = req.supabase!;

  const matching = await resolveSegmentContacts(supabase, req.tenantId!, data.filters);

  const { data: segment, error } = await supabase
    .from('contact_segments')
    .insert({
      tenant_id: req.tenantId!,
      name: data.name,
      filters: data.filters,
      contact_count: matching.length
    })
    .select()
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.status(201).json({ success: true, data: segment });
}));

router.delete('/:id', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const supabase = req.supabase!;
  const { id } = req.params;

  const { error } = await supabase
    .from('contact_segments')
    .delete()
    .eq('id', id)
    .eq('tenant_id', req.tenantId);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({ success: true, message: 'Segment deleted' });
}));

export default router;