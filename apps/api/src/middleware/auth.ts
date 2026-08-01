import { Request, Response, NextFunction } from 'express';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

export interface AuthRequest extends Request {
  user?: {
    id: string;
    tenantId: string;
    email: string;
    role: string;
  };
  tenantId?: string;
  supabase?: SupabaseClient;
}

export async function authenticateJWT(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized: No token provided' });
      return;
    }

    const token = authHeader.split(' ')[1];

    const { data: { user }, error } = await serviceSupabase.auth.getUser(token);

    if (error || !user) {
      res.status(401).json({ error: 'Unauthorized: Invalid token' });
      return;
    }

    const { data: userData, error: userError } = await serviceSupabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      res.status(401).json({ error: 'Unauthorized: User not found' });
      return;
    }

    req.user = {
      id: userData.id,
      tenantId: userData.tenant_id,
      email: userData.email,
      role: userData.role
    };
    req.tenantId = userData.tenant_id;

    next();
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized: Token validation failed' });
  }
}

export async function authenticateAPIKey(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      res.status(401).json({ error: 'Unauthorized: No API key provided' });
      return;
    }

    const supabase = req.supabase!;
    const hash = crypto.createHash('sha256').update(apiKey).digest('hex');

    const { data: foundKey, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('key_hash', hash)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .single();

    if (error || !foundKey) {
      res.status(401).json({ error: 'Unauthorized: Invalid API key' });
      return;
    }

    await supabase
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', foundKey.id);

    req.tenantId = foundKey.tenant_id;

    next();
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized: API key validation failed' });
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
      return;
    }
    next();
  };
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const apiKey = req.headers['x-api-key'];

  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authenticateJWT(req, res, next);
  }

  if (apiKey) {
    return authenticateAPIKey(req, res, next);
  }

  res.status(401).json({ error: 'Unauthorized: No authentication provided' });
}

export function asyncHandler(fn: (req: any, res: any, next: any) => Promise<any>) {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}