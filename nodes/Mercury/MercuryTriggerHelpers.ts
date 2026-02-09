import { createHmac, timingSafeEqual } from 'crypto';
import type { IDataObject, IWebhookFunctions } from 'n8n-workflow';

const SIGNATURE_HEADER = 'mercury-signature';
const MAX_AGE_SECONDS = 300;

/**
 * Verify the HMAC-SHA256 signature on an incoming Mercury webhook.
 *
 * Mercury sends a `Mercury-Signature` header in the format:
 *   t=<unix-timestamp>,v1=<hex-hmac>
 *
 * Returns `true` if valid, `false` otherwise.
 */
export function verifySignature(
	context: IWebhookFunctions,
	secret: string,
): boolean {
	const headers = context.getHeaderData() as Record<string, string>;
	const signatureHeader = headers[SIGNATURE_HEADER];

	if (!signatureHeader || !secret) {
		return false;
	}

	const parts = signatureHeader.split(',');
	const timestamp = parts.find((p) => p.startsWith('t='))?.slice(2);
	const signature = parts.find((p) => p.startsWith('v1='))?.slice(3);

	if (!timestamp || !signature) {
		return false;
	}

	// Reject webhooks older than 5 minutes to prevent replay attacks
	const age = Math.abs(Date.now() / 1000 - Number(timestamp));
	if (age > MAX_AGE_SECONDS) {
		return false;
	}

	const body = context.getBodyData() as IDataObject;
	const req = context.getRequestObject();
	const rawBody = req.rawBody ?? Buffer.from(JSON.stringify(body));
	const signedPayload = `${timestamp}.${rawBody.toString()}`;
	const expectedSignature = createHmac('sha256', secret)
		.update(signedPayload)
		.digest('hex');

	const sigBuffer = Buffer.from(signature, 'hex');
	const expectedBuffer = Buffer.from(expectedSignature, 'hex');

	if (sigBuffer.length !== expectedBuffer.length) {
		return false;
	}

	return timingSafeEqual(sigBuffer, expectedBuffer);
}
