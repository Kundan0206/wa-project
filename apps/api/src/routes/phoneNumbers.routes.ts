import { Router, Response } from 'express';
import { authenticate, AuthRequest, asyncHandler } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const supabase = req.supabase!;

  const { data: phoneNumbers, error } = await supabase
    .from('phone_numbers')
    .select('*, waba_accounts(*)')
    .eq('tenant_id', req.tenantId)
    .order('created_at', { ascending: false });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({ success: true, data: phoneNumbers || [] });
}));

router.delete('/:id', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const supabase = req.supabase!;
  const { id } = req.params;

  const { error } = await supabase
    .from('phone_numbers')
    .delete()
    .eq('id', id)
    .eq('tenant_id', req.tenantId);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({ success: true, message: 'Phone number removed' });
}));

router.get('/:id/quality', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const supabase = req.supabase!;
  const { id } = req.params;

  res.json({ success: true, data: { quality_score: 'green', status: 'verified' } });
}));

export default router;