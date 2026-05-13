import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest, requireRole, asyncHandler } from '../middleware/auth.js';

const router = Router();

router.get('/business-profile', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const supabase = req.supabase!;

  const { data: settings, error } = await supabase
    .from('tenant_settings')
    .select('*')
    .eq('tenant_id', req.tenantId)
    .single();

  if (error && error.code !== 'PGRST116') {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({ success: true, data: settings });
}));

const businessProfileSchema = z.object({
  business_name: z.string().optional(),
  business_email: z.string().email().optional(),
  business_phone: z.string().optional(),
  business_address: z.string().optional()
});

router.put('/business-profile', authenticate, requireRole('owner', 'admin'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = businessProfileSchema.parse(req.body);
  const supabase = req.supabase!;

  const { data: existing } = await supabase
    .from('tenant_settings')
    .select('id')
    .eq('tenant_id', req.tenantId)
    .single();

  if (existing) {
    const { data: updated, error } = await supabase
      .from('tenant_settings')
      .update({
        business_name: data.business_name,
        business_email: data.business_email,
        business_phone: data.business_phone,
        business_address: data.business_address,
        updated_at: new Date().toISOString()
      })
      .eq('tenant_id', req.tenantId)
      .select()
      .single();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({ success: true, data: updated });
  } else {
    const { data: created, error } = await supabase
      .from('tenant_settings')
      .insert({
        tenant_id: req.tenantId!,
        business_name: data.business_name,
        business_email: data.business_email,
        business_phone: data.business_phone,
        business_address: data.business_address
      })
      .select()
      .single();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({ success: true, data: created });
  }
}));

router.get('/notifications', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const supabase = req.supabase!;

  const { data: settings } = await supabase
    .from('tenant_settings')
    .select('notification_email, notification_sms')
    .eq('tenant_id', req.tenantId)
    .single();

  res.json({
    success: true,
    data: {
      notificationEmail: settings?.notification_email ?? true,
      notificationSms: settings?.notification_sms ?? true
    }
  });
}));

export default router;