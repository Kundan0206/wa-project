import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { asyncHandler } from '../middleware/errorHandler.js';
import { processWebhookEvent } from '../services/webhook.service.js';

const router = Router();

router.get('/whatsapp', asyncHandler(async (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN || 'whatsapp_webhook_verify';

  if (mode === 'subscribe' && token === verifyToken) {
    res.status(200).send(challenge);
    return;
  }

  res.status(403).json({ error: 'Verification failed' });
}));

router.post('/whatsapp', asyncHandler(async (req: Request, res: Response) => {
  const signature = req.headers['x-hub-signature-256'] as string | undefined;
  const appSecret = process.env.META_APP_SECRET;

  if (!appSecret) {
    console.error('META_APP_SECRET is not configured; rejecting webhook');
    res.status(500).json({ error: 'Webhook not configured' });
    return;
  }

  if (!signature) {
    res.status(401).json({ error: 'Missing signature' });
    return;
  }

  // req.rawBody is captured by the express.json verify hook in index.ts so the
  // HMAC is computed over the exact bytes Meta signed, not a re-serialized copy.
  const rawBody = (req as any).rawBody as Buffer | undefined;
  const expectedSignature = crypto
    .createHmac('sha256', appSecret)
    .update(rawBody ?? Buffer.from(JSON.stringify(req.body)))
    .digest('hex');

  const provided = signature.replace(/^sha256=/, '');
  const expectedBuf = Buffer.from(expectedSignature, 'hex');
  const providedBuf = Buffer.from(provided, 'hex');

  const isValid =
    expectedBuf.length === providedBuf.length &&
    crypto.timingSafeEqual(expectedBuf, providedBuf);

  if (!isValid) {
    console.warn('Invalid webhook signature');
    res.status(401).json({ error: 'Invalid signature' });
    return;
  }

  res.status(200).json({ success: true });

  const entries = req.body.entry || [];

  for (const entry of entries) {
    const changes = entry.changes || [];

    for (const change of changes) {
      const value = change.value || {};
      const messages = value.messages || [];
      const statuses = value.statuses || [];

      for (const message of messages) {
        await processWebhookEvent({
          phoneNumberId: value.metadata?.phone_number_id,
          message,
          contacts: value.contacts
        });
      }

      for (const status of statuses) {
        await processWebhookEvent({
          phoneNumberId: value.metadata?.phone_number_id,
          status
        });
      }
    }
  }
}));

export default router;