import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest, requireRole, asyncHandler } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const supabase = req.supabase!;

  const { data: flows, error } = await supabase
    .from('flows')
    .select('*, phone_numbers(*)')
    .eq('tenant_id', req.tenantId)
    .order('created_at', { ascending: false });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({ success: true, data: flows || [] });
}));

const createFlowSchema = z.object({
  name: z.string().min(1),
  phone_number_id: z.string(),
  trigger_type: z.enum(['keyword_match', 'first_message', 'button_click', 'any_message', 'opt_in']),
  trigger_value: z.string().optional(),
  nodes: z.array(z.any()),
  edges: z.array(z.any())
});

router.post('/', authenticate, requireRole('owner', 'admin'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = createFlowSchema.parse(req.body);
  const supabase = req.supabase!;

  const { data: flow, error } = await supabase
    .from('flows')
    .insert({
      tenant_id: req.tenantId!,
      phone_number_id: data.phone_number_id,
      name: data.name,
      trigger_type: data.trigger_type,
      trigger_value: data.trigger_value,
      nodes: data.nodes,
      edges: data.edges,
      is_active: false
    })
    .select()
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.status(201).json({ success: true, data: flow });
}));

router.get('/:id', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const supabase = req.supabase!;
  const { id } = req.params;

  const { data: flow, error } = await supabase
    .from('flows')
    .select('*, phone_numbers(*)')
    .eq('id', id)
    .eq('tenant_id', req.tenantId)
    .single();

  if (error || !flow) {
    res.status(404).json({ error: 'Flow not found' });
    return;
  }

  res.json({ success: true, data: flow });
}));

router.delete('/:id', authenticate, requireRole('owner', 'admin'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const supabase = req.supabase!;
  const { id } = req.params;

  const { error } = await supabase
    .from('flows')
    .delete()
    .eq('id', id)
    .eq('tenant_id', req.tenantId);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({ success: true, message: 'Flow deleted' });
}));

router.post('/:id/activate', authenticate, requireRole('owner', 'admin'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const supabase = req.supabase!;
  const { id } = req.params;

  const { error } = await supabase
    .from('flows')
    .update({ is_active: true })
    .eq('id', id)
    .eq('tenant_id', req.tenantId);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({ success: true, message: 'Flow activated' });
}));

router.post('/:id/deactivate', authenticate, requireRole('owner', 'admin'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const supabase = req.supabase!;
  const { id } = req.params;

  const { error } = await supabase
    .from('flows')
    .update({ is_active: false })
    .eq('id', id)
    .eq('tenant_id', req.tenantId);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({ success: true, message: 'Flow deactivated' });
}));

router.get('/:id/analytics', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const supabase = req.supabase!;
  const { id } = req.params;

  const { data: flow } = await supabase
    .from('flows')
    .select('id')
    .eq('id', id)
    .eq('tenant_id', req.tenantId)
    .single();

  if (!flow) {
    res.status(404).json({ error: 'Flow not found' });
    return;
  }

  const { count: total } = await supabase
    .from('flow_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('flow_id', id);

  const { count: completed } = await supabase
    .from('flow_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('flow_id', id)
    .eq('status', 'completed');

  const { count: failed } = await supabase
    .from('flow_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('flow_id', id)
    .eq('status', 'failed');

  const { data: recentSessions } = await supabase
    .from('flow_sessions')
    .select('id, status, error_message, current_node_id, started_at, ended_at')
    .eq('flow_id', id)
    .order('started_at', { ascending: false })
    .limit(10);

  res.json({
    success: true,
    data: {
      totalSessions: total || 0,
      completed: completed || 0,
      failed: failed || 0,
      completionRate: total ? ((completed || 0) / total * 100).toFixed(2) : '0',
      recentSessions: recentSessions || []
    }
  });
}));

export default router;