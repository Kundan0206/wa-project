import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest, requireRole, asyncHandler } from '../middleware/auth.js';
import { exchangeCodeForToken, listAccessibleWabas, getPhoneNumberDetails } from '../services/whatsapp.service.js';

const META_API_URL = process.env.META_API_URL || 'https://graph.facebook.com/v19.0';

// Never select access_token in responses that go back to the browser.
const WABA_SAFE_COLUMNS = 'id, tenant_id, waba_id, waba_name, status, currency, timezone, created_at, updated_at';
const PHONE_SAFE_COLUMNS = 'id, tenant_id, waba_id, phone_number_id, display_number, display_name, quality_rating, status, is_default, webhook_url, created_at, updated_at';

const router = Router();

// Short-lived server-side cache mapping a one-time selection token to the
// Meta access token discovered in step 1, so the browser never needs to
// hold or resubmit the raw access token to complete step 2.
const PENDING_CONNECTION_TTL_MS = 10 * 60 * 1000;
const pendingConnections = new Map<string, { accessToken: string; expiresAt: number }>();

function cachePendingConnection(accessToken: string): string {
  const token = `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
  pendingConnections.set(token, { accessToken, expiresAt: Date.now() + PENDING_CONNECTION_TTL_MS });
  return token;
}

function takePendingConnection(token: string): string | null {
  const entry = pendingConnections.get(token);
  pendingConnections.delete(token);
  if (!entry || entry.expiresAt < Date.now()) return null;
  return entry.accessToken;
}

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

const connectSchema = z.object({
  code: z.string()
});

/**
 * Step 1 of connecting a WABA: exchange the OAuth code for a token, then
 * discover every WhatsApp Business Account that token actually grants
 * management access to (including ones the user already owns in Meta
 * Business Manager, created outside this app). Returns the list instead of
 * blindly creating a new WABA, so the frontend can offer "use an existing
 * account" as well as "connect a brand new one".
 *
 * The access token is cached server-side (short-lived, in-memory) keyed by a
 * one-time selection token so step 2 doesn't need the browser to hold onto
 * (or resubmit) the raw Meta access token.
 */
router.post('/connect', authenticate, requireRole('owner', 'admin'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = connectSchema.parse(req.body);
  const supabase = req.supabase!;

  const { accessToken } = await exchangeCodeForToken(data.code);
  const wabas = await listAccessibleWabas(accessToken);

  if (wabas.length === 0) {
    res.status(404).json({ error: 'No WhatsApp Business Accounts found for this Meta login. Use "Add Number" to create a new one instead.' });
    return;
  }

  // Flag which of the discovered WABAs are already connected (by this
  // tenant, or - so the UI can explain the conflict - by another one).
  const { data: existingRows } = await supabase
    .from('waba_accounts')
    .select('waba_id, tenant_id')
    .in('waba_id', wabas.map((w) => w.wabaId));

  const selectionToken = cachePendingConnection(accessToken);

  const results = wabas.map((w) => {
    const existing = existingRows?.find((r) => r.waba_id === w.wabaId);
    return {
      wabaId: w.wabaId,
      wabaName: w.wabaName,
      currency: w.currency,
      timezone: w.timezone,
      alreadyConnected: !!existing,
      connectedToAnotherWorkspace: !!existing && existing.tenant_id !== req.tenantId
    };
  });

  res.json({ success: true, data: { selectionToken, wabas: results } });
}));

const selectWabaSchema = z.object({
  selectionToken: z.string(),
  wabaId: z.string()
});

/**
 * Step 2: finalize connecting the WABA the user picked from step 1's list.
 */
router.post('/connect/select', authenticate, requireRole('owner', 'admin'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = selectWabaSchema.parse(req.body);
  const supabase = req.supabase!;

  const accessToken = takePendingConnection(data.selectionToken);
  if (!accessToken) {
    res.status(400).json({ error: 'Selection expired, please reconnect with Meta' });
    return;
  }

  const wabas = await listAccessibleWabas(accessToken);
  const chosen = wabas.find((w) => w.wabaId === data.wabaId);

  if (!chosen) {
    res.status(400).json({ error: 'That WhatsApp Business Account is not accessible with this login' });
    return;
  }

  // A WABA already claimed by a *different* tenant must never be silently
  // reassigned - block instead of overwriting someone else's connection.
  const { data: ownedElsewhere } = await supabase
    .from('waba_accounts')
    .select('id, tenant_id')
    .eq('waba_id', chosen.wabaId)
    .neq('tenant_id', req.tenantId!)
    .maybeSingle();

  if (ownedElsewhere) {
    res.status(409).json({ error: 'This WhatsApp Business Account is already connected to another workspace' });
    return;
  }

  const { data: existing } = await supabase
    .from('waba_accounts')
    .select('id')
    .eq('waba_id', chosen.wabaId)
    .eq('tenant_id', req.tenantId)
    .single();

  if (existing) {
    const { data: updated, error } = await supabase
      .from('waba_accounts')
      .update({ access_token: accessToken, status: 'active' })
      .eq('id', existing.id)
      .eq('tenant_id', req.tenantId)
      .select(WABA_SAFE_COLUMNS)
      .single();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({ success: true, message: 'WABA account reconnected', data: updated });
    return;
  }

  const { data: account, error } = await supabase
    .from('waba_accounts')
    .insert({
      tenant_id: req.tenantId!,
      waba_id: chosen.wabaId,
      waba_name: chosen.wabaName || 'WhatsApp Business',
      access_token: accessToken,
      status: 'active',
      currency: chosen.currency || 'USD',
      timezone: chosen.timezone || 'UTC'
    })
    .select(WABA_SAFE_COLUMNS)
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.status(201).json({ success: true, message: 'WABA account connected', data: account });
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
  const { accessToken, code: bodyCode } = req.body;
  const code = req.query.code as string || bodyCode;
  
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

      connected.push(waba.wabaId);
    }

    res.json({
      success: true,
      message: connected.length > 0 ? 'WhatsApp Business Account connected successfully' : 'No accessible WhatsApp Business Accounts to connect',
      wabaIds: connected,
      skipped
    });
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

export default router;