import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest, asyncHandler } from '../middleware/auth.js';
import { supabase } from '../lib/supabase.js';
import { createTopUpOrder, creditsForAmount, verifyWebhookSignature } from '../services/billing.service.js';

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

router.get('/razorpay-config', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!process.env.RAZORPAY_KEY_ID) {
    res.status(503).json({ error: 'Payments are not configured yet' });
    return;
  }
  res.json({ success: true, data: { keyId: process.env.RAZORPAY_KEY_ID, inrToCredits: 1 } });
}));

const createOrderSchema = z.object({
  amount: z.number().min(1).max(1000000)
});

router.post('/topup/create-order', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = createOrderSchema.parse(req.body);
  const tenantSupabase = req.supabase!;

  try {
    const order = await createTopUpOrder(req.tenantId!, data.amount);

    const { error } = await tenantSupabase.from('payment_orders').insert({
      tenant_id: req.tenantId!,
      razorpay_order_id: order.id,
      amount: data.amount,
      credits: creditsForAmount(data.amount),
      status: 'created'
    });

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.status(201).json({
      success: true,
      data: { orderId: order.id, amount: data.amount, currency: order.currency }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create payment order' });
  }
}));

// Razorpay webhooks are not authenticated via our normal session/API-key
// flow - the HMAC signature below (verified against the raw body) is the
// only trust boundary. This is the sole place credits are ever added to a
// wallet; the browser's post-checkout callback is informational only and
// must never trigger a credit on its own, or a forged "success" response
// could mint free credits.
router.post('/webhook', asyncHandler(async (req: Request, res: Response) => {
  const signature = req.headers['x-razorpay-signature'] as string | undefined;
  const rawBody = (req as any).rawBody as Buffer | undefined;

  if (!rawBody || !verifyWebhookSignature(rawBody, signature)) {
    res.status(401).json({ error: 'Invalid signature' });
    return;
  }

  const event = req.body?.event;
  const payload = req.body?.payload?.payment?.entity;

  if (event !== 'payment.captured' || !payload) {
    res.status(200).json({ success: true });
    return;
  }

  const orderId = payload.order_id as string;
  const paymentId = payload.id as string;

  const { data: order, error: fetchError } = await supabase
    .from('payment_orders')
    .select('*')
    .eq('razorpay_order_id', orderId)
    .single();

  if (fetchError || !order) {
    console.error('Razorpay webhook: unknown order_id', orderId);
    res.status(200).json({ success: true });
    return;
  }

  // Razorpay retries webhook delivery on timeout/non-200 responses, so the
  // same event can arrive more than once - only credit once per order.
  if (order.status === 'paid') {
    res.status(200).json({ success: true });
    return;
  }

  const { data: lastTx } = await supabase
    .from('wallet_transactions')
    .select('balance_after')
    .eq('tenant_id', order.tenant_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const previousBalance = lastTx?.balance_after || 0;
  const newBalance = previousBalance + order.credits;

  const { error: txError } = await supabase.from('wallet_transactions').insert({
    tenant_id: order.tenant_id,
    type: 'credit',
    amount: order.credits,
    description: `Wallet top-up via Razorpay (₹${order.amount})`,
    balance_after: newBalance,
    reference_id: paymentId
  });

  if (txError) {
    console.error('Failed to record wallet credit:', txError.message);
    res.status(500).json({ error: 'Failed to credit wallet' });
    return;
  }

  await supabase
    .from('payment_orders')
    .update({ status: 'paid', razorpay_payment_id: paymentId, paid_at: new Date().toISOString() })
    .eq('id', order.id);

  res.status(200).json({ success: true });
}));

export default router;