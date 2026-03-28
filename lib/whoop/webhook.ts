import { createHmac, timingSafeEqual } from 'crypto'

/**
 * Validate a WHOOP webhook signature.
 *
 * WHOOP signs webhooks with:
 *   HMAC-SHA256(timestamp + raw_body, WHOOP_CLIENT_SECRET)
 * then base64-encodes the result.
 *
 * @param timestamp   Value of X-WHOOP-Signature-Timestamp header
 * @param rawBody     Raw request body string (must NOT be parsed yet)
 * @param signature   Value of X-WHOOP-Signature header
 * @returns true if valid, false otherwise
 */
export function validateWhoopSignature(
  timestamp: string,
  rawBody: string,
  signature: string
): boolean {
  const secret = process.env.WHOOP_WEBHOOK_SECRET
  if (!secret) {
    console.error('WHOOP_WEBHOOK_SECRET is not set')
    return false
  }

  try {
    const expected = createHmac('sha256', secret)
      .update(timestamp + rawBody)
      .digest('base64')

    const expectedBuf = Buffer.from(expected, 'utf8')
    const signatureBuf = Buffer.from(signature, 'utf8')

    // Use timing-safe comparison to prevent timing attacks
    if (expectedBuf.length !== signatureBuf.length) return false
    return timingSafeEqual(expectedBuf, signatureBuf)
  } catch {
    return false
  }
}
