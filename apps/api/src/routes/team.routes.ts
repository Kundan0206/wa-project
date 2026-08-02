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

  // inviteUserByEmail (unlike generateLink) actually sends the invite email
  // via Supabase's configured email provider - generateLink only returns a
  // link string and never delivers anything, which silently dropped every
  // invite before this fix. Supabase issues a random password internally
  // for invited users and never returns it to the caller, so no temporary
  // password is ever exposed in this response or its logs.
  const { data: inviteData, error: authError } = await supabase.auth.admin.inviteUserByEmail(data.email, {
    data: { name: data.name, tenant_id: req.tenantId },
    redirectTo: `${process.env.FRONTEND_URL || ''}/auth/login`
  });

  if (authError || !inviteData?.user) {
    res.status(500).json({ error: authError?.message || 'Failed to invite user' });
    return;
  }

  const { error: userError } = await supabase
    .from('users')
    .insert({
      id: inviteData.user.id,
      tenant_id: req.tenantId!,
      email: data.email,
      password_hash: 'managed_by_supabase_auth',
      name: data.name,
      role: data.role,
      is_active: true
    });

  if (userError) {
    // The auth user was already created and emailed - clean it up so a
    // retry isn't blocked by "user already exists" with no team row to show for it.
    await supabase.auth.admin.deleteUser(inviteData.user.id);
    res.status(500).json({ error: userError.message });
    return;
  }

  res.status(201).json({
    success: true,
    data: { id: inviteData.user.id, email: data.email, name: data.name, role: data.role },
    message: 'Invite email sent'
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

  // Delete the team row first: if this fails, the auth user (and their
  // ability to log in) is untouched and the member still shows up in the
  // list to retry from. Deleting auth first would risk the opposite - a
  // team row pointing at an already-deleted auth user.
  const { error: deleteError } = await supabase.from('users').delete().eq('id', id);

  if (deleteError) {
    res.status(500).json({ error: deleteError.message });
    return;
  }

  await supabase.auth.admin.deleteUser(id);

  res.json({ success: true, message: 'Member removed' });
}));

export default router;