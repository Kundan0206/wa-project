import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest, requireRole, asyncHandler } from '../middleware/auth.js';
import { exchangeCodeForToken, getPhoneNumberDetails } from '../services/whatsapp.service.js';

const META_API_URL = process.env.META_API_URL || 'https://graph.facebook.com/v19.0';

const router = Router();

router.get('/', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const supabase = req.supabase!;

  const { data: accounts, error } = await supabase
    .from('waba_accounts')
    .select('*, phone_numbers(*)')
    .eq('tenant_id', req.tenantId)
    .order('created_at', { ascending: false });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({ success: true, data: accounts || [] });
}));

const connectSchema = z.object({
  code: z.string()
});

router.post('/connect', authenticate, requireRole('owner', 'admin'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = connectSchema.parse(req.body);
  const supabase = req.supabase!;

  const tokenData = await exchangeCodeForToken(data.code);

  const { data: existing } = await supabase
    .from('waba_accounts')
    .select('id')
    .eq('waba_id', tokenData.wabaId)
    .single();

  if (existing) {
    await supabase
      .from('waba_accounts')
      .update({
        access_token: tokenData.accessToken,
        status: 'active'
      })
      .eq('id', existing.id);

    res.json({ success: true, message: 'WABA account updated', data: { wabaId: tokenData.wabaId } });
    return;
  }

  const { data: account, error } = await supabase
    .from('waba_accounts')
    .insert({
      tenant_id: req.tenantId!,
      waba_id: tokenData.wabaId,
      waba_name: tokenData.wabaName || 'WhatsApp Business',
      access_token: tokenData.accessToken,
      status: 'active',
      currency: tokenData.currency || 'USD',
      timezone: tokenData.timezone || 'UTC'
    })
    .select()
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.status(201).json({ success: true, data: account });
}));

router.delete('/:id', authenticate, requireRole('owner', 'admin'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const supabase = req.supabase!;
  const { id } = req.params;

  const { error } = await supabase
    .from('waba_accounts')
    .delete()
    .eq('id', id)
    .eq('tenant_id', req.tenantId);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({ success: true, message: 'WABA account disconnected' });
}));

router.get('/callback', asyncHandler(async (req: AuthRequest, res: Response) => {
  const frontendUrl = process.env.FRONTEND_URL || 'https://wa.builddreams.co.in';
  const { code, error: oauthError, error_description } = req.query;

  if (oauthError) {
    res.redirect(`${frontendUrl}/dashboard/whatsapp?error=${oauthError}&message=${error_description}`);
    return;
  }

  if (code) {
    res.redirect(`${frontendUrl}/dashboard/whatsapp?code=${code}`);
    return;
  }

  res.redirect(`${frontendUrl}/dashboard/whatsapp?error=no_code`);
}));

router.post('/embedded-callback', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { accessToken } = req.body;
  const code = req.query.code as string;
  
  let token = accessToken;
  
  if (code && !token) {
    const exchangeResponse = await fetch(`${META_API_URL}/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.META_APP_ID || '',
        client_secret: process.env.META_APP_SECRET || '',
        redirect_uri: `${process.env.FRONTEND_URL}/dashboard/whatsapp`,
        code
      })
    });
    const exchangeData = await exchangeResponse.json() as any;
    token = exchangeData.access_token;
    
    if (!token) {
      res.status(400).json({ error: 'Failed to exchange code for token', details: exchangeData });
      return;
    }
  }
  
  if (!token) {
    res.status(400).json({ error: 'Access token or code is required' });
    return;
  }

  try {
    const debugResponse = await fetch(`${META_API_URL}/debug_token?input_token=${token}`, {
      headers: { 'Authorization': `Bearer ${process.env.META_SYSTEM_USER_TOKEN}` }
    });
    const debugData = await debugResponse.json() as any;

    if (!debugData.data?.is_valid) {
      res.status(400).json({ error: 'Invalid access token' });
      return;
    }

    const wabaIds = debugData.data.granular_scopes?.find((s: any) => s.scope === 'whatsapp_business_management')?.target_ids || [];

    for (const wabaId of wabaIds) {
      const wabaResponse = await fetch(`${META_API_URL}/${wabaId}?fields=id,name,timezone_id,message_template_namespace,currency`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const wabaData = await wabaResponse.json() as any;

      if (wabaData.id) {
        const supabase = req.supabase!;
        
        const { data: existing } = await supabase
          .from('waba_accounts')
          .select('id')
          .eq('waba_id', wabaId)
          .eq('tenant_id', req.tenantId)
          .single();

        if (!existing) {
          await supabase.from('waba_accounts').insert({
            tenant_id: req.tenantId,
            waba_id: wabaId,
            waba_name: wabaData.name || 'New WhatsApp Business',
            currency: wabaData.currency || 'USD',
            timezone: wabaData.timezone_id || '1',
            access_token: accessToken,
            status: 'active'
          });
        }
      }
    }

    res.json({ success: true, message: 'WhatsApp Business Account created successfully', wabaIds });
  } catch (error: any) {
    console.error('Embedded signup error:', error);
    res.status(500).json({ error: error.message || 'Failed to process Embedded Signup' });
  }
}));

router.get('/embedded-signup-config', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  res.json({
    success: true,
    configId: process.env.META_EMBEDDED_SIGNUP_CONFIG_ID || '2026748608261800',
    appId: process.env.META_APP_ID
  });
}));

router.get('/meta-details/:id', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const supabase = req.supabase!;
  const { id } = req.params;

  const { data: waba, error } = await supabase
    .from('waba_accounts')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', req.tenantId)
    .single();

  if (error || !waba) {
    res.status(404).json({ error: 'WABA account not found' });
    return;
  }

  const response = await fetch(`${META_API_URL}/${waba.waba_id}?fields=id,name,timezone_id,message_template_namespace,currency`, {
    headers: { 'Authorization': `Bearer ${waba.access_token}` }
  });

  const data = await response.json();
  res.json({ success: true, data });
}));

async function readJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

export default router;