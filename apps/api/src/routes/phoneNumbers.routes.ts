import { Router, Response } from 'express';
import { authenticate, AuthRequest, asyncHandler } from '../middleware/auth.js';
import { getPhoneNumberQuality, registerPhoneNumber, deregisterPhoneNumber, getWabaPhoneNumbers, requestVerificationCode, verifyPhoneNumber, getPhoneNumberDetails } from '../services/whatsapp.service.js';

// Never select access_token in responses that go back to the browser.
const WABA_SAFE_COLUMNS = 'id, tenant_id, waba_id, waba_name, status, currency, timezone, created_at, updated_at';

const router = Router();

router.get('/', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const supabase = req.supabase!;

  const { data: phoneNumbers, error } = await supabase
    .from('phone_numbers')
    .select(`*, waba_accounts(${WABA_SAFE_COLUMNS})`)
    .eq('tenant_id', req.tenantId)
    .order('created_at', { ascending: false });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({ success: true, data: phoneNumbers || [] });
}));

router.post('/sync', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const supabase = req.supabase!;

  const { data: wabaAccounts } = await supabase
    .from('waba_accounts')
    .select('*')
    .eq('tenant_id', req.tenantId)
    .eq('status', 'active');

  if (!wabaAccounts || wabaAccounts.length === 0) {
    res.status(400).json({ error: 'No active WABA account found' });
    return;
  }

  const waba = wabaAccounts[0];
  const metaPhones = await getWabaPhoneNumbers(waba.access_token, waba.waba_id);

  for (const metaPhone of metaPhones) {
    const { data: existing } = await supabase
      .from('phone_numbers')
      .select('id')
      .eq('phone_number_id', metaPhone.id)
      .eq('tenant_id', req.tenantId)
      .single();

    if (!existing) {
      await supabase
        .from('phone_numbers')
        .insert({
          tenant_id: req.tenantId!,
          waba_id: waba.id,
          phone_number_id: metaPhone.id,
          display_number: metaPhone.display_phone_number,
          display_name: metaPhone.verified_name,
          quality_rating: metaPhone.quality_rating?.toLowerCase() || 'na',
          status: 'active',
          is_default: false
        });
    } else {
      await supabase
        .from('phone_numbers')
        .update({
          display_number: metaPhone.display_phone_number,
          display_name: metaPhone.verified_name,
          quality_rating: metaPhone.quality_rating?.toLowerCase() || 'na'
        })
        .eq('id', existing.id);
    }
  }

  const { data: phoneNumbers } = await supabase
    .from('phone_numbers')
    .select(`*, waba_accounts(${WABA_SAFE_COLUMNS})`)
    .eq('tenant_id', req.tenantId);

  res.json({ success: true, data: phoneNumbers || [], message: `Synced ${metaPhones.length} phone numbers` });
}));

router.post('/register/:id', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const supabase = req.supabase!;
  const { id } = req.params;
  const { pin, display_name } = req.body;

  const { data: phoneNumber, error: phoneError } = await supabase
    .from('phone_numbers')
    .select('*, waba_accounts(*)')
    .eq('id', id)
    .eq('tenant_id', req.tenantId)
    .single();

  if (phoneError || !phoneNumber) {
    res.status(404).json({ error: 'Phone number not found' });
    return;
  }

  const result = await registerPhoneNumber(
    phoneNumber.waba_accounts.access_token,
    phoneNumber.phone_number_id,
    display_name || phoneNumber.display_name
  );

  await supabase
    .from('phone_numbers')
    .update({ status: 'registered' })
    .eq('id', id);

  res.json({ success: true, data: result, message: 'Phone number registered successfully' });
}));

router.post('/deregister/:id', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const supabase = req.supabase!;
  const { id } = req.params;

  const { data: phoneNumber, error: phoneError } = await supabase
    .from('phone_numbers')
    .select('*, waba_accounts(*)')
    .eq('id', id)
    .eq('tenant_id', req.tenantId)
    .single();

  if (phoneError || !phoneNumber) {
    res.status(404).json({ error: 'Phone number not found' });
    return;
  }

  await deregisterPhoneNumber(
    phoneNumber.waba_accounts.access_token,
    phoneNumber.phone_number_id
  );

  await supabase
    .from('phone_numbers')
    .update({ status: 'deregistered' })
    .eq('id', id);

  res.json({ success: true, message: 'Phone number deregistered successfully' });
}));

router.delete('/:id', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const supabase = req.supabase!;
  const { id } = req.params;

  const { error } = await supabase
    .from('phone_numbers')
    .delete()
    .eq('id', id)
    .eq('tenant_id', req.tenantId);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({ success: true, message: 'Phone number removed' });
}));

router.post('/:id/set-default', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const supabase = req.supabase!;
  const { id } = req.params;

  const { data: phoneNumber } = await supabase
    .from('phone_numbers')
    .select('id, waba_id')
    .eq('id', id)
    .eq('tenant_id', req.tenantId)
    .single();

  if (!phoneNumber) {
    res.status(404).json({ error: 'Phone number not found' });
    return;
  }

  // Only one default per WABA - clear any existing default on the same
  // account before setting the new one.
  await supabase
    .from('phone_numbers')
    .update({ is_default: false })
    .eq('waba_id', phoneNumber.waba_id)
    .eq('tenant_id', req.tenantId);

  const { error } = await supabase
    .from('phone_numbers')
    .update({ is_default: true })
    .eq('id', id)
    .eq('tenant_id', req.tenantId);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({ success: true, message: 'Default phone number updated' });
}));

router.get('/:id/quality', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const supabase = req.supabase!;
  const { id } = req.params;

  const { data: phoneNumber, error } = await supabase
    .from('phone_numbers')
    .select('*, waba_accounts(*)')
    .eq('id', id)
    .eq('tenant_id', req.tenantId)
    .single();

  if (error || !phoneNumber) {
    res.status(404).json({ error: 'Phone number not found' });
    return;
  }

  try {
    const qualityData = await getPhoneNumberQuality(
      phoneNumber.waba_accounts.access_token,
      phoneNumber.phone_number_id
    );

    res.json({ success: true, data: qualityData });
  } catch (err: any) {
    res.json({ success: true, data: { quality_score: phoneNumber.quality_rating, status: phoneNumber.status } });
  }
}));

router.post('/request-code/:id', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const supabase = req.supabase!;
  const { id } = req.params;
  const { method = 'SMS' } = req.body;

  const { data: phoneNumber, error: phoneError } = await supabase
    .from('phone_numbers')
    .select('*, waba_accounts(*)')
    .eq('id', id)
    .eq('tenant_id', req.tenantId)
    .single();

  if (phoneError || !phoneNumber) {
    res.status(404).json({ error: 'Phone number not found' });
    return;
  }

  const result = await requestVerificationCode(
    phoneNumber.waba_accounts.access_token,
    phoneNumber.phone_number_id,
    method
  );

  res.json({ success: true, data: result, message: 'Verification code sent' });
}));

router.post('/verify-code/:id', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const supabase = req.supabase!;
  const { id } = req.params;
  const { code } = req.body;

  if (!code) {
    res.status(400).json({ error: 'Verification code required' });
    return;
  }

  const { data: phoneNumber, error: phoneError } = await supabase
    .from('phone_numbers')
    .select('*, waba_accounts(*)')
    .eq('id', id)
    .eq('tenant_id', req.tenantId)
    .single();

  if (phoneError || !phoneNumber) {
    res.status(404).json({ error: 'Phone number not found' });
    return;
  }

  const result = await verifyPhoneNumber(
    phoneNumber.waba_accounts.access_token,
    phoneNumber.phone_number_id,
    code
  );

  await supabase
    .from('phone_numbers')
    .update({ status: 'verified' })
    .eq('id', id);

  res.json({ success: true, data: result, message: 'Phone number verified successfully' });
}));

router.get('/:id/details', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const supabase = req.supabase!;
  const { id } = req.params;

  const { data: phoneNumber, error } = await supabase
    .from('phone_numbers')
    .select('*, waba_accounts(*)')
    .eq('id', id)
    .eq('tenant_id', req.tenantId)
    .single();

  if (error || !phoneNumber) {
    res.status(404).json({ error: 'Phone number not found' });
    return;
  }

  try {
    const details = await getPhoneNumberDetails(
      phoneNumber.waba_accounts.access_token,
      phoneNumber.phone_number_id
    );

    res.json({ success: true, data: details });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}));

export default router;