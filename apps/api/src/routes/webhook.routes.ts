import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
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
  const signature = req.headers['x-hub-signature-256'];
  const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN || 'whatsapp_webhook_verify';

  const payload = JSON.stringify(req.body);
  const expectedSignature = crypto
    .createHmac('sha256', verifyToken)
    .update(payload)
    .digest('hex');

  if (signature && signature !== `sha256=${expectedSignature}`) {
    console.warn('Invalid webhook signature');
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