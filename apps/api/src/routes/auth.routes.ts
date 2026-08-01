import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { authenticate, AuthRequest, asyncHandler } from '../middleware/auth.js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  companyName: z.string().optional()
});

router.post('/register', asyncHandler(async (req: Request, res: Response) => {
  const data = registerSchema.parse(req.body);
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { data: foundUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', data.email)
    .maybeSingle();

  if (foundUser) {
    res.status(400).json({ error: 'User already exists' });
    return;
  }

  const slug = data.companyName?.toLowerCase().replace(/[^a-z0-9]/g, '-')
    || data.email.split('@')[0].toLowerCase();

  const { data: existingTenant } = await supabase
    .from('tenants')
    .select('slug')
    .eq('slug', slug)
    .single();

  const tenantSlug = existingTenant ? `${slug}-${Date.now()}` : slug;

  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .insert({
      name: data.companyName || data.name,
      slug: tenantSlug,
      plan: 'free',
      status: 'active'
    })
    .select()
    .single();

  if (tenantError) {
    res.status(500).json({ error: 'Failed to create tenant' });
    return;
  }

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true,
    user_metadata: {
      name: data.name,
      tenant_id: tenant.id
    }
  });

  if (authError || !authData.user) {
    await supabase.from('tenants').delete().eq('id', tenant.id);
    res.status(500).json({ error: authError?.message || 'Failed to create user' });
    return;
  }

  const { error: userError } = await supabase
    .from('users')
    .insert({
      id: authData.user.id,
      tenant_id: tenant.id,
      email: data.email,
      password_hash: 'managed_by_supabase_auth',
      name: data.name,
      role: 'owner',
      is_active: true
    });

  if (userError) {
    console.error('User insert error:', userError);
  }

  await supabase
    .from('tenant_settings')
    .insert({ tenant_id: tenant.id });

  const { data: sessionData } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password
  });

  res.status(201).json({
    success: true,
    data: {
      token: sessionData?.session?.access_token,
      user: { id: authData.user.id, email: authData.user.email!, name: data.name, role: 'owner' },
      tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug }
    }
  });
}));

router.post('/login', asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password required' });
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (authError || !authData.user) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*, tenants!inner(*)')
    .eq('id', authData.user.id)
    .single();

  if (userError || !userData) {
    res.status(401).json({ error: 'User not found' });
    return;
  }

  res.json({
    success: true,
    data: {
      token: authData.session?.access_token,
      user: { id: userData.id, email: userData.email, name: userData.name, role: userData.role },
      tenant: { id: userData.tenant_id, name: userData.tenants?.name, slug: userData.tenants?.slug }
    }
  });
}));

router.post('/logout', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const token = req.headers.authorization?.split(' ')[1];

  if (token) {
    await supabase.auth.signOut();
  }

  res.json({ success: true, message: 'Logged out successfully' });
}));

router.post('/change-password', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const supabase = req.supabase!;

  const { error } = await supabase.auth.resetPasswordForEmail(req.user!.email, {
    redirectTo: `${process.env.FRONTEND_URL || ''}/auth/login`
  });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({ success: true, message: 'Password reset email sent' });
}));

router.get('/me', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const supabase = req.supabase!;

  const { data: user, error } = await supabase
    .from('users')
    .select('*, tenants!inner(*)')
    .eq('id', req.user!.id)
    .single();

  if (error || !user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  res.json({
    success: true,
    data: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatarUrl: user.avatar_url,
      tenant: { id: user.tenant_id, name: user.tenants?.name, slug: user.tenants?.slug, plan: user.tenants?.plan }
    }
  });
}));

export default router;