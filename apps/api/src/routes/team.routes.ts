import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest, requireRole, asyncHandler } from '../middleware/auth.js';

const router = Router();

router.get('/members', authenticate, requireRole('owner', 'admin'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const supabase = req.supabase!;

  const { data: members, error } = await supabase
    .from('users')
    .select('id, email, name, role, avatar_url, is_active, created_at')
    .eq('tenant_id', req.tenantId);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({ success: true, data: members || [] });
}));

const inviteSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(['admin', 'agent', 'viewer'])
});

router.post('/invite', authenticate, requireRole('owner', 'admin'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = inviteSchema.parse(req.body);
  const supabase = req.supabase!;

  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('tenant_id', req.tenantId)
    .eq('email', data.email)
    .single();

  if (existing) {
    res.status(400).json({ error: 'User already exists in this team' });
    return;
  }

  const tempPassword = Math.random().toString(36).slice(-8);

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: data.email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { name: data.name, tenant_id: req.tenantId }
  });

  if (authError || !authData.user) {
    res.status(500).json({ error: authError?.message || 'Failed to create user' });
    return;
  }

  const { error: userError } = await supabase
    .from('users')
    .insert({
      id: authData.user.id,
      tenant_id: req.tenantId!,
      email: data.email,
      password_hash: 'managed_by_supabase_auth',
      name: data.name,
      role: data.role,
      is_active: true
    });

  if (userError) {
    res.status(500).json({ error: userError.message });
    return;
  }

  res.status(201).json({
    success: true,
    data: { id: authData.user.id, email: data.email, name: data.name, role: data.role },
    message: `User invited. Temporary password: ${tempPassword}`
  });
}));

router.delete('/members/:id', authenticate, requireRole('owner', 'admin'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const supabase = req.supabase!;
  const { id } = req.params;

  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('id', id)
    .eq('tenant_id', req.tenantId)
    .single();

  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  if (user.role === 'owner') {
    res.status(403).json({ error: 'Cannot remove owner' });
    return;
  }

  await supabase.auth.admin.deleteUser(id);

  await supabase.from('users').delete().eq('id', id);

  res.json({ success: true, message: 'Member removed' });
}));

export default router;