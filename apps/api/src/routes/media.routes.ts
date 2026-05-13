import { Router, Response } from 'express';
import { authenticate, AuthRequest, requireRole, asyncHandler } from '../middleware/auth.js';
import { uploadToSupabaseStorage, uploadToWhatsApp } from '../services/media.service.js';

const router = Router();

router.post('/upload', authenticate, requireRole('owner', 'admin'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { file, file_type, file_name } = req.body;
  const supabase = req.supabase!;

  if (!file) {
    res.status(400).json({ error: 'File content required' });
    return;
  }

  const s3Key = `media/${req.tenantId}/${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const buffer = Buffer.from(file, 'base64');
  const publicUrl = await uploadToSupabaseStorage(buffer, s3Key, file_type || 'application/octet-stream');

  const { data: waba } = await supabase
    .from('waba_accounts')
    .select('*')
    .eq('tenant_id', req.tenantId)
    .eq('status', 'active')
    .single();

  let whatsappMediaId: string | undefined;
  let expiresAt: Date | undefined;

  if (waba) {
    const result = await uploadToWhatsApp(waba.access_token, file, file_type);
    whatsappMediaId = result.id;
    expiresAt = result.expiresAt;
  }

  const { data: media, error } = await supabase
    .from('media_files')
    .insert({
      tenant_id: req.tenantId!,
      original_name: file_name || 'file',
      file_type: file_type || 'document',
      mime_type: file_type || 'application/octet-stream',
      size_bytes: buffer.length,
      s3_key: s3Key,
      public_url: publicUrl,
      whatsapp_media_id: whatsappMediaId,
      whatsapp_media_id_expires_at: expiresAt?.toISOString()
    })
    .select()
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.status(201).json({ success: true, data: media });
}));

router.get('/', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const supabase = req.supabase!;
  const { page = '1', limit = '20' } = req.query;

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const { data: files, error } = await supabase
    .from('media_files')
    .select('*', { count: 'exact' })
    .eq('tenant_id', req.tenantId)
    .order('created_at', { ascending: false })
    .range(skip, skip + parseInt(limit as string) - 1);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({ success: true, data: files || [] });
}));

router.delete('/:id', authenticate, requireRole('owner', 'admin'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const supabase = req.supabase!;
  const { id } = req.params;

  const { error } = await supabase
    .from('media_files')
    .delete()
    .eq('id', id)
    .eq('tenant_id', req.tenantId);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({ success: true, message: 'Media file deleted' });
}));

export default router;