import { createHmac, timingSafeEqual, randomBytes } from "node:crypto";

/**
 * Digital pass tokens.
 *
 * The QR encodes `EC1.<payload>.<sig>` where payload is base64url JSON
 * { r: registrationId, e: eventId, n: nonce } and sig is HMAC-SHA256.
 * A volunteer's scanner can verify authenticity offline; the server then
 * checks revocation and records the CheckIn.
 */

const PREFIX = "EC1";

function secret(): string {
  const s = process.env.PASS_SIGNING_SECRET;
  if (!s || s.length < 32) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("PASS_SIGNING_SECRET must be set (32+ chars) in production.");
    }
    return "dev-only-insecure-pass-secret-change-me-please";
  }
  return s;
}

const b64url = (buf: Buffer) => buf.toString("base64url");

function sign(payload: string): string {
  return b64url(createHmac("sha256", secret()).update(`${PREFIX}.${payload}`).digest());
}

export interface PassClaims {
  registrationId: string;
  eventId: string;
}

export function createPassToken(claims: PassClaims): string {
  const payload = b64url(
    Buffer.from(
      JSON.stringify({ r: claims.registrationId, e: claims.eventId, n: randomBytes(6).toString("hex") }),
    ),
  );
  return `${PREFIX}.${payload}.${sign(payload)}`;
}

export function verifyPassToken(token: string): PassClaims | null {
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== PREFIX) return null;
  const [, payload, sig] = parts;

  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (typeof data.r !== "string" || typeof data.e !== "string") return null;
    return { registrationId: data.r, eventId: data.e };
  } catch {
    return null;
  }
}

/** Human-readable serial: EC-<EVENT PREFIX>-0042 */
export function passSerial(eventSlug: string, sequence: number): string {
  const prefix = eventSlug.replace(/[^a-z0-9]/gi, "").slice(0, 4).toUpperCase() || "EVNT";
  return `EC-${prefix}-${String(sequence).padStart(4, "0")}`;
}
