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

export async function sendWhatsAppMessage(
  accessToken: string,
  phoneNumberId: string,
  to: string,
  message: WhatsAppMessage,
  wamid?: string
) {
  const url = wamid
    ? `${META_API_URL}/${wamid}/messages`
    : `${META_API_URL}/${phoneNumberId}/messages`;

  const { messaging_product: _messagingProduct, to: _messageTo, ...messageBody } = message;
  const payload = {
    messaging_product: 'whatsapp',
    to,
    ...messageBody
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const data = await readJson<{ error?: { message?: string } }>(response);

  if (data.error) {
    throw new Error(data.error.message);
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

export async function exchangeCodeForToken(code: string) {
  const clientId = process.env.META_APP_ID;
  const clientSecret = process.env.META_APP_SECRET;
  const redirectUri = process.env.META_REDIRECT_URI || 'https://your-domain.com/api/v1/waba/callback';

  const response = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?client_id=${clientId}&client_secret=${clientSecret}&code=${code}&redirect_uri=${redirectUri}`, {
    method: 'GET'
  });

  const data = await readJson<{ error?: { message?: string }; access_token: string }>(response);

  if (data.error) {
    throw new Error(data.error.message);
  }

  const meResponse = await fetch(`${META_API_URL}/me?fields=id,name,business_phone_number,timezone,currency&access_token=${data.access_token}`);
  const meData = await readJson<{
    id: string;
    name?: string;
    currency?: string;
    timezone?: string;
  }>(meResponse);

  return {
    accessToken: data.access_token,
    wabaId: meData.id,
    wabaName: meData.name,
    currency: meData.currency,
    timezone: meData.timezone
  };
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

  return readJson(response);
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

  return readJson(response);
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

  return readJson(response);
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

  return readJson(response);
}

export async function getPhoneNumberDetails(accessToken: string, phoneNumberId: string) {
  const response = await fetch(`${META_API_URL}/${phoneNumberId}?fields=id,display_phone_number,verified_name,quality_rating,status,code_verification_status,name_status,certificate`, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });

  return readJson(response);
}

export async function subscribeToPhoneWebhooks(accessToken: string, phoneNumberId: string, webhookUrl: string) {
  const response = await fetch(`${META_API_URL}/${phoneNumberId}/webhooks`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      url: webhookUrl,
      fields: ['messages', 'message_template_status_update', 'phone_number_quality_update']
    })
  });

  return readJson(response);
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

  const data = await readJson<{ error?: { message?: string } }>(response);

  if (data.error) {
    throw new Error(data.error.message);
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

export async function getTemplateAnalytics(accessToken: string, templateId: string) {
  const response = await fetch(`${META_API_URL}/${templateId}?fields=quality_score,status`, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });

  const data = await readJson<{ quality_score?: number; status?: string }>(response);

  return {
    qualityScore: data.quality_score || 0,
    status: data.status
  };
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

export async function subscribeToWebhooks(accessToken: string, phoneNumberId: string, callbackUrl: string) {
  const response = await fetch(`${META_API_URL}/${phoneNumberId}/webhooks`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      url: callbackUrl,
      fields: ['messages', 'message_template_status_update', 'phone_number_quality_update']
    })
  });

  return readJson(response);
}