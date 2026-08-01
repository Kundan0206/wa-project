import { Router, Response } from 'express';
import { authenticate, AuthRequest, asyncHandler } from '../middleware/auth.js';

const router = Router();

router.get('/overview', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const supabase = req.supabase!;

  const [{ count: totalMessages }, { count: sentMessages }, { count: deliveredMessages }, { count: readMessages }, { count: totalContacts }, { count: activeConversations }] = await Promise.all([
    supabase.from('messages').select('*', { count: 'exact', head: true }).eq('tenant_id', req.tenantId),
    supabase.from('messages').select('*', { count: 'exact', head: true }).eq('tenant_id', req.tenantId).eq('direction', 'outbound'),
    supabase.from('messages').select('*', { count: 'exact', head: true }).eq('tenant_id', req.tenantId).eq('status', 'delivered'),
    supabase.from('messages').select('*', { count: 'exact', head: true }).eq('tenant_id', req.tenantId).eq('status', 'read'),
    supabase.from('contacts').select('*', { count: 'exact', head: true }).eq('tenant_id', req.tenantId),
    supabase.from('conversations').select('*', { count: 'exact', head: true }).eq('tenant_id', req.tenantId).eq('status', 'open')
  ]);

  res.json({
    success: true,
    data: {
      totalMessages: totalMessages || 0,
      sent: sentMessages || 0,
      delivered: deliveredMessages || 0,
      read: readMessages || 0,
      deliveryRate: sentMessages ? ((deliveredMessages || 0) / sentMessages * 100).toFixed(2) : '0',
      readRate: deliveredMessages ? ((readMessages || 0) / deliveredMessages * 100).toFixed(2) : '0',
      totalContacts: totalContacts || 0,
      activeConversations: activeConversations || 0
    }
  });
}));

router.get('/messages', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const supabase = req.supabase!;

  const { data: messages } = await supabase
    .from('messages')
    .select('type, status')
    .eq('tenant_id', req.tenantId);

  const byType: Record<string, number> = {};
  const byStatus: Record<string, number> = {};

  messages?.forEach(m => {
    byType[m.type] = (byType[m.type] || 0) + 1;
    byStatus[m.status] = (byStatus[m.status] || 0) + 1;
  });

  res.json({ success: true, data: { byType, byStatus } });
}));

router.get('/inbox', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  res.json({ success: true, data: { conversationsByAgent: {}, avgFirstResponseTime: 0 } });
}));

router.get('/trends', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const supabase = req.supabase!;
  const days = Math.min(parseInt(req.query.days as string) || 7, 90);

  const since = new Date();
  since.setDate(since.getDate() - (days - 1));
  since.setHours(0, 0, 0, 0);

  const { data: messages } = await supabase
    .from('messages')
    .select('created_at, direction, status')
    .eq('tenant_id', req.tenantId)
    .gte('created_at', since.toISOString());

  const buckets = new Map<string, { sent: number; delivered: number; read: number }>();
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    buckets.set(d.toISOString().slice(0, 10), { sent: 0, delivered: 0, read: 0 });
  }

  for (const m of messages || []) {
    const day = m.created_at.slice(0, 10);
    const bucket = buckets.get(day);
    if (!bucket) continue;
    if (m.direction === 'outbound') bucket.sent++;
    if (m.status === 'delivered' || m.status === 'read') bucket.delivered++;
    if (m.status === 'read') bucket.read++;
  }

  const trends = Array.from(buckets.entries()).map(([date, counts]) => ({ date, ...counts }));

  res.json({ success: true, data: trends });
}));

export default router;