import { supabase } from '../lib/supabase.js';

const BUCKET_NAME = process.env.SUPABASE_BUCKET_NAME || 'whatsapp-media';

export async function uploadToSupabaseStorage(
  buffer: Buffer,
  filePath: string,
  mimeType: string = 'application/octet-stream'
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, buffer, {
      contentType: mimeType,
      upsert: false
    });

  if (error) {
    throw new Error(`Failed to upload to Supabase: ${error.message}`);
  }

  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}

export async function downloadFromSupabaseStorage(filePath: string): Promise<Buffer> {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .download(filePath);

  if (error) {
    throw new Error(`Failed to download from Supabase: ${error.message}`);
  }

  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function deleteFromSupabaseStorage(filePath: string): Promise<void> {
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([filePath]);

  if (error) {
    throw new Error(`Failed to delete from Supabase: ${error.message}`);
  }
}

const META_API_URL = process.env.META_API_URL || 'https://graph.facebook.com/v19.0';

async function readJson<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

export async function uploadToWhatsApp(accessToken: string, fileData: string | Buffer, fileType: string) {
  const formData = new FormData();
  const blob = new Blob([typeof fileData === 'string' ? Buffer.from(fileData, 'base64') : fileData]);
  formData.append('file', blob, 'file');
  formData.append('type', fileType);
  formData.append('messaging_product', 'whatsapp');

  const response = await fetch(`${META_API_URL}/uploads`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    },
    body: formData
  });

  const data = await readJson<{ error?: { message?: string }; id: string }>(response);

  if (data.error) {
    throw new Error(data.error.message);
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  return {
    id: data.id,
    expiresAt
  };
}

export async function refreshWhatsAppMedia(accessToken: string, mediaId: string) {
  const response = await fetch(`${META_API_URL}/${mediaId}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  const data = await readJson<{ error?: { message?: string }; id: string }>(response);

  if (data.error) {
    throw new Error(data.error.message);
  }

  return {
    id: data.id,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  };
}