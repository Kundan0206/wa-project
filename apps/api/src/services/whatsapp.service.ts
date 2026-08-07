const META_API_URL = process.env.META_API_URL || 'https://graph.facebook.com/v19.0';

export interface WhatsAppMessage {
  messaging_product?: string;
  to?: string;
  type: string;
  [key: string]: any;
}

async function readJson<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

interface MetaError {
  message?: string;
  type?: string;
  code?: number;
  error_subcode?: number;
  error_user_title?: string;
  error_user_msg?: string;
  error_data?: { details?: string };
  fbtrace_id?: string;
}

// Meta's top-level error.message is often a generic label ("Invalid
// parameter"); the actionable detail is in error_user_msg / error_user_title
// / error_data.details, which most of this codebase used to discard.
export function formatMetaError(error: MetaError): string {
  const parts = [
    error.error_user_title,
    error.error_user_msg,
    error.error_data?.details,
    !error.error_user_msg && !error.error_data?.details ? error.message : undefined
  ].filter(Boolean);

  const detail = parts.length > 0 ? parts.join(' — ') : (error.message || 'Unknown error from Meta');
  const code = error.code ? ` (code ${error.code}${error.error_subcode ? `.${error.error_subcode}` : ''})` : '';
  return `${detail}${code}`;
}

export async function sendWhatsAppMessage(
  accessToken: string,
  phoneNumberId: string,
  to: string,
  message: WhatsAppMessage
) {
  const { messaging_product: _messagingProduct, to: _messageTo, ...messageBody } = message;
  const payload = {
    messaging_product: 'whatsapp',
    to,
    ...messageBody
  };

  const response = await fetch(`${META_API_URL}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const data = await readJson<{ error?: MetaError }>(response);

  if (data.error) {
    throw new Error(formatMetaError(data.error));
  }

  return data;
}

// Marks an inbound message as read (and shows the "typing"/blue-tick receipt
// to the customer). This is a distinct Cloud API call from sending a message
// - it POSTs a status update to the phone number's /messages endpoint, not
// to the message itself.
export async function markMessageAsRead(accessToken: string, phoneNumberId: string, wamid: string) {
  const response = await fetch(`${META_API_URL}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: wamid
    })
  });

  const data = await readJson<{ error?: MetaError }>(response);

  if (data.error) {
    throw new Error(formatMetaError(data.error));
  }

  return data;
}

export async function sendTemplateMessage(
  accessToken: string,
  phoneNumberId: string,
  to: string,
  templateName: string,
  languageCode: string,
  components?: any[]
) {
  const message = {
    type: 'template',
    template: {
      name: templateName,
      language: { code: languageCode },
      ...(components && { components })
    }
  };

  return sendWhatsAppMessage(accessToken, phoneNumberId, to, message);
}

export interface DiscoveredWaba {
  wabaId: string;
  wabaName?: string;
  currency?: string;
  timezone?: string;
}

/**
 * Exchanges an OAuth code for a User access token. Does NOT resolve a WABA -
 * a User access token grants access to zero or more existing WhatsApp
 * Business Accounts, which must be discovered separately (see
 * listAccessibleWabas) so the caller can let the user pick one instead of
 * guessing.
 */
export async function exchangeCodeForToken(code: string) {
  const clientId = process.env.META_APP_ID;
  const clientSecret = process.env.META_APP_SECRET;
  const redirectUri = process.env.META_REDIRECT_URI || 'https://your-domain.com/api/v1/waba/callback';

  const response = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?client_id=${clientId}&client_secret=${clientSecret}&code=${code}&redirect_uri=${redirectUri}`, {
    method: 'GET'
  });

  const data = await readJson<{ error?: MetaError; access_token: string }>(response);

  if (data.error) {
    throw new Error(formatMetaError(data.error));
  }

  return { accessToken: data.access_token };
}

/**
 * Discovers the WhatsApp Business Accounts a given access token actually has
 * management access to, via debug_token's granular_scopes. This is how an
 * already-existing WABA (one the user manages in Meta Business Manager, not
 * created through this app) gets surfaced so it can be connected instead of
 * always creating a brand new one via Embedded Signup.
 */
export async function listAccessibleWabas(accessToken: string): Promise<DiscoveredWaba[]> {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  const inspectToken = process.env.META_SYSTEM_USER_TOKEN || `${appId}|${appSecret}`;

  const debugResponse = await fetch(`${META_API_URL}/debug_token?input_token=${accessToken}`, {
    headers: { 'Authorization': `Bearer ${inspectToken}` }
  });
  const debugData = await readJson<{
    data?: { is_valid?: boolean; granular_scopes?: Array<{ scope: string; target_ids?: string[] }> };
    error?: MetaError;
  }>(debugResponse);

  if (debugData.error || !debugData.data?.is_valid) {
    throw new Error(debugData.error ? formatMetaError(debugData.error) : 'Invalid access token');
  }

  const wabaIds = debugData.data.granular_scopes?.find(
    (s) => s.scope === 'whatsapp_business_management'
  )?.target_ids || [];

  const wabas = await Promise.all(
    wabaIds.map(async (wabaId): Promise<DiscoveredWaba | null> => {
      const wabaResponse = await fetch(
        `${META_API_URL}/${wabaId}?fields=id,name,timezone_id,currency`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      );
      const wabaData = await readJson<{ id?: string; name?: string; currency?: string; timezone_id?: string }>(wabaResponse);

      if (!wabaData.id) return null;

      return {
        wabaId: wabaData.id,
        wabaName: wabaData.name,
        currency: wabaData.currency,
        timezone: wabaData.timezone_id
      };
    })
  );

  return wabas.filter((w): w is DiscoveredWaba => w !== null);
}

export async function registerPhoneNumber(
  accessToken: string,
  phoneNumberId: string,
  displayName: string
) {
  const response = await fetch(`${META_API_URL}/${phoneNumberId}/register`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ messaging_product: 'whatsapp', display_name: displayName })
  });

  const data = await readJson<{ error?: MetaError }>(response);

  if (data.error) {
    throw new Error(formatMetaError(data.error));
  }

  return data;
}

export async function getPhoneNumberQuality(accessToken: string, phoneNumberId: string) {
  const response = await fetch(`${META_API_URL}/${phoneNumberId}?fields=quality_score,status,code_verification_status`, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });

  const data = await readJson<{ quality_score?: string; status?: string; code_verification_status?: string }>(response);

  return {
    qualityScore: data.quality_score?.toLowerCase() || 'na',
    status: data.status,
    codeVerificationStatus: data.code_verification_status
  };
}

export async function getWabaPhoneNumbers(accessToken: string, wabaId: string) {
  const response = await fetch(`${META_API_URL}/${wabaId}/phone_numbers?fields=id,display_phone_number,verified_name,quality_rating,status,code_verification_status`, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });

  const data = await readJson<{ data?: Array<{ id: string; display_phone_number: string; verified_name: string; quality_rating: string; status: string; code_verification_status: string }> }>(response);

  return data.data || [];
}

export async function deregisterPhoneNumber(accessToken: string, phoneNumberId: string) {
  const response = await fetch(`${META_API_URL}/${phoneNumberId}/deregister`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  const data = await readJson<{ error?: MetaError }>(response);

  if (data.error) {
    throw new Error(formatMetaError(data.error));
  }

  return data;
}

export async function requestVerificationCode(accessToken: string, phoneNumberId: string, method: string = 'SMS', locale: string = 'en_US') {
  const response = await fetch(`${META_API_URL}/${phoneNumberId}/request_code`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ code_method: method, locale })
  });

  const data = await readJson<{ error?: MetaError }>(response);

  if (data.error) {
    throw new Error(formatMetaError(data.error));
  }

  return data;
}

export async function verifyPhoneNumber(accessToken: string, phoneNumberId: string, code: string) {
  const response = await fetch(`${META_API_URL}/${phoneNumberId}/verify_code`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ code })
  });

  const data = await readJson<{ error?: MetaError }>(response);

  if (data.error) {
    throw new Error(formatMetaError(data.error));
  }

  return data;
}

export async function getPhoneNumberDetails(accessToken: string, phoneNumberId: string) {
  const response = await fetch(`${META_API_URL}/${phoneNumberId}?fields=id,display_phone_number,verified_name,quality_rating,status,code_verification_status,name_status,certificate`, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });

  return readJson(response);
}

/**
 * Subscribes this app (via its own app-level webhook, configured once in the
 * Meta App Dashboard) to receive webhook events for a WABA. There is no
 * per-phone-number or per-callback-URL webhook registration in the WhatsApp
 * Cloud API - the only lever is this WABA -> app subscription. Without it,
 * Meta has nowhere to route the WABA's events regardless of how correct the
 * app's webhook URL/signature setup is.
 */
export async function subscribeAppToWaba(accessToken: string, wabaId: string) {
  const response = await fetch(`${META_API_URL}/${wabaId}/subscribed_apps`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  return readJson<{ success?: boolean; error?: { message?: string } }>(response);
}

export async function getSubscribedApps(accessToken: string, wabaId: string) {
  const response = await fetch(`${META_API_URL}/${wabaId}/subscribed_apps`, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });

  return readJson<{ data?: Array<{ whatsapp_business_api_data?: { id?: string; name?: string } }> }>(response);
}

export async function createTemplate(
  accessToken: string,
  wabaId: string,
  template: {
    name: string;
    category: string;
    language: string;
    components: any[];
  }
) {
  const response = await fetch(`${META_API_URL}/${wabaId}/message_templates`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(template)
  });

  const data = await readJson<{ error?: MetaError }>(response);

  if (data.error) {
    throw new Error(formatMetaError(data.error));
  }

  return data;
}

export async function deleteTemplate(accessToken: string, templateId: string) {
  const response = await fetch(`${META_API_URL}/${templateId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });

  return readJson(response);
}

export async function syncTemplateFromMeta(accessToken: string, templateId: string) {
  const response = await fetch(
    `${META_API_URL}/${templateId}?fields=status,quality_score,rejected_reason`,
    { headers: { 'Authorization': `Bearer ${accessToken}` } }
  );

  const data = await readJson<{
    status?: string;
    quality_score?: { score?: string };
    rejected_reason?: string;
    error?: MetaError;
  }>(response);

  if (data.error) {
    throw new Error(formatMetaError(data.error));
  }

  return {
    status: data.status?.toLowerCase(),
    qualityScore: data.quality_score?.score,
    rejectionReason: data.rejected_reason
  };
}

export interface MetaTemplateListItem {
  id: string;
  name: string;
  category: string;
  language: string;
  status: string;
  qualityScore?: string;
  rejectionReason?: string;
  components: any[];
}

// Fetches every template Meta has for a WABA, following cursor pagination -
// used to bring in templates that exist on Meta's side but were never
// created through this app (e.g. made directly in Meta Business Manager).
export async function listTemplatesFromMeta(accessToken: string, wabaId: string): Promise<MetaTemplateListItem[]> {
  const results: MetaTemplateListItem[] = [];
  let url: string | undefined =
    `${META_API_URL}/${wabaId}/message_templates?fields=id,name,category,language,status,quality_score,rejected_reason,components&limit=100`;

  while (url) {
    const response: Response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    const data = await readJson<{
      data?: Array<{
        id: string;
        name: string;
        category: string;
        language: string;
        status: string;
        quality_score?: { score?: string };
        rejected_reason?: string;
        components?: any[];
      }>;
      paging?: { next?: string };
      error?: MetaError;
    }>(response);

    if (data.error) {
      throw new Error(formatMetaError(data.error));
    }

    for (const t of data.data || []) {
      results.push({
        id: t.id,
        name: t.name,
        category: (t.category || 'utility').toLowerCase(),
        language: t.language,
        status: (t.status || 'pending').toLowerCase(),
        qualityScore: t.quality_score?.score,
        rejectionReason: t.rejected_reason,
        components: t.components || []
      });
    }

    url = data.paging?.next;
  }

  return results;
}

export async function downloadWhatsAppMedia(accessToken: string, mediaId: string) {
  const response = await fetch(`${META_API_URL}/${mediaId}`, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });

  const data = await readJson<{ url?: string }>(response);

  if (data.url) {
    const mediaResponse = await fetch(data.url, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    return {
      content: Buffer.from(await mediaResponse.arrayBuffer()),
      mimeType: mediaResponse.headers.get('content-type')
    };
  }

  throw new Error('No media URL found');
}

