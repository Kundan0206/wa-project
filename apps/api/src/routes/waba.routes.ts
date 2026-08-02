import { Router, Response } from 'express';
import { authenticate, AuthRequest, requireRole, asyncHandler } from '../middleware/auth.js';
import { listAccessibleWabas, getPhoneNumberDetails, subscribeAppToWaba, formatMetaError } from '../services/whatsapp.service.js';

const META_API_URL = process.env.META_API_URL || 'https://graph.facebook.com/v19.0';

// Never select access_token in responses that go back to the browser.
const WABA_SAFE_COLUMNS = 'id, tenant_id, waba_id, waba_name, status, currency, timezone, created_at, updated_at';
const PHONE_SAFE_COLUMNS = 'id, tenant_id, waba_id, phone_number_id, display_number, display_name, quality_rating, status, is_default, webhook_url, created_at, updated_at';

const router = Router();

router.get('/', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const supabase = req.supabase!;

  const { data: accounts, error } = await supabase
    .from('waba_accounts')
    .select(`${WABA_SAFE_COLUMNS}, phone_numbers(${PHONE_SAFE_COLUMNS})`)
    .eq('tenant_id', req.tenantId)
    .order('created_at', { ascending: false });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({ success: true, data: accounts || [] });
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

router.post('/embedded-callback', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { accessToken, code: bodyCode } = req.body;
  const code = req.query.code as string || bodyCode;
  
  let token = accessToken;
  
  if (code && !token) {
    // Embedded Signup codes come from FB.login's JS SDK callback, not a
    // browser redirect - Meta does not expect (and will reject with a 400)
    // a redirect_uri on this exchange, unlike the classic OAuth dialog flow.
    const exchangeParams = new URLSearchParams({
      client_id: process.env.META_APP_ID || '',
      client_secret: process.env.META_APP_SECRET || '',
      code
    });
    const exchangeResponse = await fetch(`${META_API_URL}/oauth/access_token?${exchangeParams}`, {
      method: 'GET'
    });
    const exchangeData = await exchangeResponse.json() as any;
    token = exchangeData.access_token;

    if (!token) {
      console.error('Embedded Signup token exchange failed:', exchangeData);
      res.status(400).json({ error: 'Failed to exchange code for token', details: exchangeData.error?.message || exchangeData });
      return;
    }
  }
  
  if (!token) {
    res.status(400).json({ error: 'Access token or code is required' });
    return;
  }

  try {
    const supabase = req.supabase!;
    const wabas = await listAccessibleWabas(token);

    const connected: string[] = [];
    const skipped: Array<{ wabaId: string; reason: string }> = [];

    for (const waba of wabas) {
      // Never silently reassign a WABA another tenant already connected.
      const { data: ownedElsewhere } = await supabase
        .from('waba_accounts')
        .select('id')
        .eq('waba_id', waba.wabaId)
        .neq('tenant_id', req.tenantId!)
        .maybeSingle();

      if (ownedElsewhere) {
        skipped.push({ wabaId: waba.wabaId, reason: 'already connected to another workspace' });
        continue;
      }

      const { data: existing } = await supabase
        .from('waba_accounts')
        .select('id')
        .eq('waba_id', waba.wabaId)
        .eq('tenant_id', req.tenantId)
        .single();

      if (existing) {
        await supabase
          .from('waba_accounts')
          .update({ access_token: token, status: 'active' })
          .eq('id', existing.id);
      } else {
        await supabase.from('waba_accounts').insert({
          tenant_id: req.tenantId,
          waba_id: waba.wabaId,
          waba_name: waba.wabaName || 'New WhatsApp Business',
          currency: waba.currency || 'USD',
          timezone: waba.timezone || '1',
          access_token: token,
          status: 'active'
        });
      }

      // Without this, Meta has nowhere to route the WABA's events - the
      // app-level webhook URL alone is not enough, each WABA must also be
      // subscribed to this app.
      try {
        await subscribeAppToWaba(token, waba.wabaId);
      } catch (err: any) {
        console.error(`Failed to subscribe app to WABA ${waba.wabaId}:`, err.message);
      }

      connected.push(waba.wabaId);
    }

    res.json({
      success: true,
      message: connected.length > 0 ? 'WhatsApp Business Account connected successfully' : 'No accessible WhatsApp Business Accounts to connect',
      data: { wabaIds: connected, skipped }
    });
  } catch (error: any) {
    console.error('Embedded signup error:', error);
    res.status(500).json({ error: error.message || 'Failed to process Embedded Signup' });
  }
}));

router.post('/:id/subscribe', authenticate, requireRole('owner', 'admin'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const supabase = req.supabase!;
  const { id } = req.params;

  const { data: waba, error } = await supabase
    .from('waba_accounts')
    .select('waba_id, access_token')
    .eq('id', id)
    .eq('tenant_id', req.tenantId)
    .single();

  if (error || !waba) {
    res.status(404).json({ error: 'WABA account not found' });
    return;
  }

  try {
    const result = await subscribeAppToWaba(waba.access_token, waba.waba_id);
    if (result.error) {
      res.status(400).json({ error: result.error.message });
      return;
    }
    res.json({ success: true, message: 'Subscribed to webhooks for this WhatsApp Business Account' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to subscribe to webhooks' });
  }
}));

// Cheap, no-op health check that calls Meta with the WABA's stored access
// token so a dead/under-permissioned token (the cause of "code 200: You do
// not have the necessary permission..." errors) surfaces immediately from
// the dashboard, instead of only being discovered when a real send fails.
router.post('/:id/test-connection', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const supabase = req.supabase!;
  const { id } = req.params;

  const { data: waba, error } = await supabase
    .from('waba_accounts')
    .select('waba_id, waba_name, access_token, phone_numbers(phone_number_id, display_number)')
    .eq('id', id)
    .eq('tenant_id', req.tenantId)
    .single();

  if (error || !waba) {
    res.status(404).json({ error: 'WABA account not found' });
    return;
  }

  const checks: Array<{ check: string; ok: boolean; detail: string }> = [];

  try {
    const wabaResponse = await fetch(
      `${META_API_URL}/${waba.waba_id}?fields=id,name`,
      { headers: { 'Authorization': `Bearer ${waba.access_token}` } }
    );
    const wabaData = await wabaResponse.json() as any;

    if (wabaData.error) {
      checks.push({ check: 'Account access', ok: false, detail: formatMetaError(wabaData.error) });
    } else {
      checks.push({ check: 'Account access', ok: true, detail: 'Token can read this WhatsApp Business Account' });
    }
  } catch (err: any) {
    checks.push({ check: 'Account access', ok: false, detail: err.message || 'Request to Meta failed' });
  }

  const phoneNumbers = (waba.phone_numbers as any[]) || [];
  if (phoneNumbers.length === 0) {
    checks.push({ check: 'Messaging permission', ok: false, detail: 'No phone numbers connected to test' });
  } else {
    for (const phone of phoneNumbers) {
      try {
        const phoneResponse = await fetch(
          `${META_API_URL}/${phone.phone_number_id}?fields=id,quality_rating`,
          { headers: { 'Authorization': `Bearer ${waba.access_token}` } }
        );
        const phoneData = await phoneResponse.json() as any;

        if (phoneData.error) {
          checks.push({
            check: `Messaging permission (${phone.display_number})`,
            ok: false,
            detail: formatMetaError(phoneData.error)
          });
        } else {
          checks.push({
            check: `Messaging permission (${phone.display_number})`,
            ok: true,
            detail: 'Token has access to this phone number'
          });
        }
      } catch (err: any) {
        checks.push({
          check: `Messaging permission (${phone.display_number})`,
          ok: false,
          detail: err.message || 'Request to Meta failed'
        });
      }
    }
  }

  const healthy = checks.every((c) => c.ok);

  res.json({
    success: true,
    data: { healthy, checks }
  });
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

export default router;