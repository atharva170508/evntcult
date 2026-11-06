/**
 * IDs, secrets and codes. Uses Web Crypto only, so it runs in Workers, Node and the browser.
 *
 *  • passToken   — the scannable secret. 128 bits of randomness, base32 (26 chars).
 *                  It means nothing on its own; the server looks it up in the DB.
 *  • passCode    — the human-readable display code (EC-VALO-0042). Decorative only:
 *                  it can't be used to check in.
 *  • accessCode  — 7-character private-event code, no look-alike characters.
 */

const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function randomBytes(n: number): Uint8Array {
  const b = new Uint8Array(n);
  crypto.getRandomValues(b);
  return b;
}

/** RFC 4648 base32 (no padding). */
export function base32(bytes: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let out = "";
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += BASE32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += BASE32[(value << (5 - bits)) & 31];
  return out;
}

/** 128-bit random secret, base32 encoded → 26 characters. */
export function newPassToken(): string {
  return base32(randomBytes(16));
}

export const QR_PREFIX = "evntcult://p/";

/** What the QR code contains. Verification is a DB lookup — never parse meaning from it. */
export const passQrPayload = (token: string) => `${QR_PREFIX}${token}`;

/** Accepts either the raw token or the full QR payload and returns the token. */
export function extractPassToken(input: string): string {
  const s = input.trim();
  return (s.startsWith(QR_PREFIX) ? s.slice(QR_PREFIX.length) : s).toUpperCase();
}

export const isWellFormedPassToken = (t: string) => /^[A-Z2-7]{26}$/.test(t);

/** Display code like EC-VALO-0042 from the event slug and a sequence number. */
export function passCode(eventSlug: string, sequence: number): string {
  const prefix = eventSlug.replace(/[^a-z0-9]/gi, "").slice(0, 4).toUpperCase() || "EVNT";
  return `EC-${prefix}-${String(sequence).padStart(4, "0")}`;
}

/** Unbiased random index in [0, n). */
function randomIndex(n: number): number {
  const limit = Math.floor(0x1_0000_0000 / n) * n;
  const buf = new Uint32Array(1);
  do crypto.getRandomValues(buf);
  while (buf[0] >= limit);
  return buf[0] % n;
}

/** No 0/O, 1/I/L, 5/S, 2/Z, 8/B — survives being read off a projector. */
export const ACCESS_CODE_ALPHABET = "ACDEFGHJKMNPQRTUVWXY34679";
export const ACCESS_CODE_LENGTH = 7;

export function newAccessCode(): string {
  let out = "";
  for (let i = 0; i < ACCESS_CODE_LENGTH; i++) out += ACCESS_CODE_ALPHABET[randomIndex(ACCESS_CODE_ALPHABET.length)];
  return out;
}

export const normalizeAccessCode = (input: string) => input.trim().toUpperCase().replace(/[\s-]/g, "");

export function isWellFormedAccessCode(input: string): boolean {
  const c = normalizeAccessCode(input);
  return c.length === ACCESS_CODE_LENGTH && [...c].every((ch) => ACCESS_CODE_ALPHABET.includes(ch));
}

export const newId = () => crypto.randomUUID();
