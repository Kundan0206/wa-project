import { Router, Response } from 'express';
import { authenticate, AuthRequest, asyncHandler } from '../middleware/auth.js';

const router = Router();

router.get('/plan', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const supabase = req.supabase!;

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*, plans(*)')
    .eq('tenant_id', req.tenantId)
    .single();

  const { data: plans } = await supabase.from('plans').select('*');

  res.json({ success: true, data: { current: subscription, plans: plans || [] } });
}));

router.get('/usage', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const supabase = req.supabase!;

  const [{ count: messageCount }, { count: contactCount }, { count: agentCount }] = await Promise.all([
    supabase.from('messages').select('*', { count: 'exact', head: true }).eq('tenant_id', req.tenantId),
    supabase.from('contacts').select('*', { count: 'exact', head: true }).eq('tenant_id', req.tenantId),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('tenant_id', req.tenantId)
  ]);

  res.json({
    success: true,
    data: {
      messages: messageCount || 0,
      contacts: contactCount || 0,
      agents: agentCount || 0
    }
  });
}));

router.get('/wallet', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const supabase = req.supabase!;

  const { data: transactions } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('tenant_id', req.tenantId)
    .order('created_at', { ascending: false })
    .limit(20);

  const balance = transactions?.reduce((acc, t) => t.type === 'credit' ? acc + t.amount : acc - t.amount, 0) || 0;

  res.json({ success: true, data: { balance, transactions: transactions || [] } });
}));

export default router;