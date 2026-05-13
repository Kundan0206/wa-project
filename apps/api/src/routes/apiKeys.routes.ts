import { Router, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { authenticate, AuthRequest, requireRole, asyncHandler } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const supabase = req.supabase!;

  const { data: keys, error } = await supabase
    .from('api_keys')
    .select('id, name, prefix, scopes, last_used_at, expires_at, created_at')
    .eq('tenant_id', req.tenantId)
    .order('created_at', { ascending: false });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({ success: true, data: keys || [] });
}));

const createKeySchema = z.object({
  name: z.string().min(1),
  scopes: z.array(z.string()).default(['messages:send', 'messages:read']),
  expires_at: z.string().datetime().optional()
});

router.post('/', authenticate, requireRole('owner', 'admin'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = createKeySchema.parse(req.body);
  const supabase = req.supabase!;

  const key = uuidv4().replace(/-/g, '');
  const prefix = `wa_${key.slice(0, 8)}`;
  const keyHash = crypto.createHash('sha256').update(key).digest('hex');

  const { data: apiKey, error } = await supabase
    .from('api_keys')
    .insert({
      tenant_id: req.tenantId!,
      name: data.name,
      key_hash: keyHash,
      prefix,
      scopes: data.scopes,
      expires_at: data.expires_at ? new Date(data.expires_at).toISOString() : null
    })
    .select()
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.status(201).json({
    success: true,
    data: {
      id: apiKey.id,
      name: apiKey.name,
      key: `${prefix}_${key}`,
      prefix: apiKey.prefix,
      scopes: apiKey.scopes,
      expires_at: apiKey.expires_at
    }
  });
}));

router.delete('/:id', authenticate, requireRole('owner', 'admin'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const supabase = req.supabase!;
  const { id } = req.params;

  const { error } = await supabase
    .from('api_keys')
    .delete()
    .eq('id', id)
    .eq('tenant_id', req.tenantId);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({ success: true, message: 'API key deleted' });
}));

export default router;