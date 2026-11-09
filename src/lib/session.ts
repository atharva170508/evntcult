/**
 * Signed session cookie (no JWT in localStorage).
 *
 *   ec_session = <base64url(userId)>.<expiresEpochSeconds>.<base64url(HMAC-SHA256)>
 *
 * httpOnly, SameSite=Lax, Secure in production. Web Crypto only, so it also runs in middleware.
 */

export const SESSION_COOKIE = "ec_session";
export const SESSION_DAYS = 14;

const enc = new TextEncoder();

function b64url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = "";
  for (const b of arr) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64url(s: string): string {
  const pad = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  return atob(pad);
}

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("SESSION_SECRET must be set (32+ characters).");
  return s;
}

async function hmac(data: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64url(await crypto.subtle.sign("HMAC", key, enc.encode(data)));
}

/** Constant-time string compare. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function createSessionValue(userId: string, now = Date.now()): Promise<string> {
  const exp = Math.floor(now / 1000) + SESSION_DAYS * 86_400;
  const body = `${b64url(enc.encode(userId))}.${exp}`;
  return `${body}.${await hmac(body)}`;
}

/** Returns the user id if the cookie is authentic and not expired, else null. */
export async function readSessionValue(value: string | undefined | null, now = Date.now()): Promise<string | null> {
  if (!value) return null;
  const parts = value.split(".");
  if (parts.length !== 3) return null;
  const [uid, expStr, sig] = parts;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp * 1000 < now) return null;
  if (!safeEqual(sig, await hmac(`${uid}.${expStr}`))) return null;
  try {
    return fromB64url(uid);
  } catch {
    return null;
  }
}

/* Owner panel: a separate cookie, signed for a different purpose, so a student session can never open it. */
export const ADMIN_COOKIE = "ec_admin";
const ADMIN_HOURS = 8;

export async function createAdminValue(now = Date.now()): Promise<string> {
  const exp = Math.floor(now / 1000) + ADMIN_HOURS * 3600;
  return `admin.${exp}.${await hmac(`admin-panel:${exp}`)}`;
}

export async function readAdminValue(value: string | undefined | null, now = Date.now()): Promise<boolean> {
  if (!value) return false;
  const parts = value.split(".");
  if (parts.length !== 3 || parts[0] !== "admin") return false;
  const exp = Number(parts[1]);
  if (!Number.isFinite(exp) || exp * 1000 < now) return false;
  return safeEqual(parts[2], await hmac(`admin-panel:${parts[1]}`));
}

const secureFlag = () => (process.env.NODE_ENV === "production" ? "; Secure" : "");
export const adminCookieHeader = (value: string) => `${ADMIN_COOKIE}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${ADMIN_HOURS * 3600}${secureFlag()}`;
export const clearAdminCookieHeader = () => `${ADMIN_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secureFlag()}`;

export function sessionCookieHeader(value: string, maxAgeSeconds = SESSION_DAYS * 86_400): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${SESSION_COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${secure}`;
}

export const clearSessionCookieHeader = () => sessionCookieHeader("", 0);
