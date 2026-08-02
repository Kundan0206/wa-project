import Razorpay from 'razorpay';
import crypto from 'crypto';

const INR_TO_CREDITS = 1; // 1 rupee = 1 credit

let razorpayClient: Razorpay | null = null;

function getRazorpay(): Razorpay {
  if (!razorpayClient) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      throw new Error('Razorpay is not configured (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET missing)');
    }
    razorpayClient = new Razorpay({ key_id: keyId, key_secret: keySecret });
  }
  return razorpayClient;
}

export function creditsForAmount(amountInRupees: number): number {
  return amountInRupees * INR_TO_CREDITS;
}

/**
 * Creates a Razorpay order for a wallet top-up. The tenant ID is embedded in
 * the order's `notes` so the webhook (which only receives Razorpay entity
 * IDs, not our own auth context) can identify which tenant to credit
 * without a separate lookup - Razorpay echoes notes back verbatim on both
 * the order and payment webhook payloads.
 */
export async function createTopUpOrder(tenantId: string, amountInRupees: number) {
  if (!Number.isFinite(amountInRupees) || amountInRupees < 1) {
    throw new Error('Amount must be at least ₹1');
  }
  // Razorpay expects amount in paise (smallest currency subunit).
  const amountInPaise = Math.round(amountInRupees * 100);

  const order = await getRazorpay().orders.create({
    amount: amountInPaise,
    currency: 'INR',
    receipt: `topup_${tenantId}_${Date.now()}`,
    notes: { tenant_id: tenantId, credits: String(creditsForAmount(amountInRupees)) }
  });

  return order;
}

/**
 * Verifies the HMAC-SHA256 signature Razorpay sends on webhook requests,
 * using the raw request body exactly as received (re-serializing JSON can
 * change byte-for-byte content and break the signature, the same class of
 * bug the Meta webhook had before it was fixed). Never trust a webhook
 * payload - or a client-side "payment succeeded" callback - without this.
 */
export function verifyWebhookSignature(rawBody: Buffer, signatureHeader: string | undefined): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signatureHeader) return false;

  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

  const expectedBuf = Buffer.from(expected, 'hex');
  const providedBuf = Buffer.from(signatureHeader, 'hex');
  if (expectedBuf.length !== providedBuf.length) return false;

  return crypto.timingSafeEqual(expectedBuf, providedBuf);
}

/**
 * Verifies the signature returned by Razorpay Checkout directly to the
 * browser after a payment. This alone is NOT sufficient to credit a wallet
 * (the browser is not a trusted source), but it's still worth checking
 * before eagerly showing a "payment successful" UI state - the webhook
 * remains the sole source of truth for actually crediting credits.
 */
export function verifyCheckoutSignature(orderId: string, paymentId: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;

  const expected = crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
  const expectedBuf = Buffer.from(expected, 'hex');
  const providedBuf = Buffer.from(signature, 'hex');
  if (expectedBuf.length !== providedBuf.length) return false;

  return crypto.timingSafeEqual(expectedBuf, providedBuf);
}
