import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth.js';

export async function tenantMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const tenantId = req.tenantId || req.headers['x-tenant-id'] as string;

  if (!tenantId) {
    res.status(400).json({ error: 'Tenant ID is required' });
    return;
  }

  const prisma = (req as any).prisma as any;

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId }
  });

  if (!tenant || tenant.status !== 'active') {
    res.status(403).json({ error: 'Tenant not found or inactive' });
    return;
  }

  next();
}

export function validateTenant(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.tenantId) {
    res.status(400).json({ error: 'Tenant identification required' });
    return;
  }
  next();
}