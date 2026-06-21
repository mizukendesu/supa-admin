import { createHmac, timingSafeEqual } from "node:crypto";

const SIGNATURE_HEADER = "x-supaadmin-signature";
const SIGNATURE_PREFIX = "sha256=";

export function parseSupaAdminSignature(header: string | null): string | null {
  if (!header) return null;

  const trimmed = header.trim();
  if (!trimmed.startsWith(SIGNATURE_PREFIX)) {
    return null;
  }

  const hex = trimmed.slice(SIGNATURE_PREFIX.length);
  return /^[0-9a-f]{64}$/i.test(hex) ? hex.toLowerCase() : null;
}

export function computeSupaAdminSignature(
  payload: string | Buffer,
  secret: string,
): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function verifySupaAdminSignature(
  payload: string | Buffer,
  secret: string,
  signatureHeader: string | null,
): boolean {
  const provided = parseSupaAdminSignature(signatureHeader);
  if (!provided) return false;

  const expected = computeSupaAdminSignature(payload, secret);
  const providedBuffer = Buffer.from(provided, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");

  if (providedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(providedBuffer, expectedBuffer);
}

export { SIGNATURE_HEADER };
