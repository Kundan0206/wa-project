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

export default router;