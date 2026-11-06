/**
 * One-time 6-digit login codes (M6).
 *
 * - Only an HMAC-SHA256 hash of the code is stored (keyed with SESSION_SECRET, salted with the email).
 * - A code expires after 10 minutes and allows at most 5 tries; then a new code is needed.
 * - Sending a new code cancels any older unused code for that email.
 * - Rate limits: 1 code per email per 30 s, 5 per email per hour, 20 per IP per hour.
 *
 * Takes the D1 database as an argument (no "server-only") so tests can use it directly.
 */
import { newId } from "@/lib/tokens";

export const CODE_TTL_MS = 10 * 60_000;
export const MAX_TRIES = 5;
export const LIMITS = {
  resendGapMs: 30_000,
  perEmailPerHour: 5,
  perIpPerHour: 20,
} as const;

export class LoginCodeError extends Error {
  constructor(
    public status: number,
    public code: "rate_limited" | "invalid_code" | "code_expired" | "too_many_tries" | "no_code",
    message: string,
    public retryAfterSec?: number,
    public triesLeft?: number,
  ) {
    super(message);
  }
}

/** Uniform 6-digit code, 000000–999999, from the crypto RNG (rejection sampling, so no bias). */
export function generateCode(): string {
  const buf = new Uint32Array(1);
  const limit = Math.floor(0x1_0000_0000 / 1_000_000) * 1_000_000;
  do crypto.getRandomValues(buf);
  while (buf[0] >= limit);
  return String(buf[0] % 1_000_000).padStart(6, "0");
}

export async function hashCode(secret: string, email: string, code: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`login:${email}:${code}`));
  return [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Compare two equal-length hex strings without stopping at the first difference. */
function sameHash(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function countSince(db: D1Database, column: "email" | "ip", value: string, since: Date): Promise<number> {
  const row = await db
    .prepare(`SELECT COUNT(*) AS n FROM login_codes WHERE ${column} = ? AND created_at > ?`)
    .bind(value, since.toISOString())
    .first<{ n: number }>();
  return row?.n ?? 0;
}

/**
 * Create a new code for this email (after checking the rate limits) and return it so the caller can send it.
 * The plain code is never written to the database.
 */
export async function issueCode(
  db: D1Database,
  opts: { email: string; ip: string | null; secret: string; now?: Date },
): Promise<{ id: string; code: string; expiresAt: string }> {
  const now = opts.now ?? new Date();
  const hourAgo = new Date(now.getTime() - 3_600_000);

  const last = await db
    .prepare("SELECT created_at FROM login_codes WHERE email = ? ORDER BY created_at DESC LIMIT 1")
    .bind(opts.email)
    .first<{ created_at: string }>();
  if (last) {
    const wait = Date.parse(last.created_at) + LIMITS.resendGapMs - now.getTime();
    if (wait > 0) throw new LoginCodeError(429, "rate_limited", "We just sent you a code. Wait a few seconds before asking for another.", Math.ceil(wait / 1000));
  }
  if ((await countSince(db, "email", opts.email, hourAgo)) >= LIMITS.perEmailPerHour)
    throw new LoginCodeError(429, "rate_limited", "Too many codes for this email. Try again in an hour.", 3600);
  if (opts.ip && (await countSince(db, "ip", opts.ip, hourAgo)) >= LIMITS.perIpPerHour)
    throw new LoginCodeError(429, "rate_limited", "Too many login attempts from this network. Try again later.", 3600);

  const code = generateCode();
  const id = newId();
  const expiresAt = new Date(now.getTime() + CODE_TTL_MS).toISOString();
  await db.batch([
    // Only the newest code works: retire older unused ones.
    db.prepare("UPDATE login_codes SET used_at = ? WHERE email = ? AND used_at IS NULL").bind(now.toISOString(), opts.email),
    db
      .prepare("INSERT INTO login_codes (id, email, code_hash, ip, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)")
      .bind(id, opts.email, await hashCode(opts.secret, opts.email, code), opts.ip, now.toISOString(), expiresAt),
  ]);
  return { id, code, expiresAt };
}

/** The newest unused code for this email, if any (does not use up a try). */
export async function pendingCode(db: D1Database, email: string, now: Date = new Date()) {
  const row = await db
    .prepare("SELECT id, expires_at, attempts FROM login_codes WHERE email = ? AND used_at IS NULL ORDER BY created_at DESC LIMIT 1")
    .bind(email)
    .first<{ id: string; expires_at: string; attempts: number }>();
  if (!row) return null;
  return { ...row, expired: Date.parse(row.expires_at) <= now.getTime(), locked: row.attempts >= MAX_TRIES };
}

/** Check a code. Every check uses up one try. On success the code is used up and can't be used again. */
export async function verifyCode(db: D1Database, opts: { email: string; code: string; secret: string; now?: Date }): Promise<void> {
  const now = opts.now ?? new Date();
  const row = await pendingCode(db, opts.email, now);
  if (!row) throw new LoginCodeError(400, "no_code", "Ask for a login code first.");
  if (row.expired) throw new LoginCodeError(400, "code_expired", "That code has expired. Ask for a new one.");

  // Take a try atomically, so parallel guesses can't get more than 5 between them.
  const took = await db
    .prepare("UPDATE login_codes SET attempts = attempts + 1 WHERE id = ? AND attempts < ? AND used_at IS NULL RETURNING attempts")
    .bind(row.id, MAX_TRIES)
    .first<{ attempts: number }>();
  if (!took) throw new LoginCodeError(429, "too_many_tries", "Too many wrong tries. Ask for a new code.");

  const stored = await db.prepare("SELECT code_hash FROM login_codes WHERE id = ?").bind(row.id).first<{ code_hash: string }>();
  const ok = !!stored && /^\d{6}$/.test(opts.code) && sameHash(stored.code_hash, await hashCode(opts.secret, opts.email, opts.code));
  if (!ok) {
    const left = MAX_TRIES - took.attempts;
    if (left <= 0) throw new LoginCodeError(429, "too_many_tries", "Too many wrong tries. Ask for a new code.");
    throw new LoginCodeError(400, "invalid_code", `That code isn't right. ${left} ${left === 1 ? "try" : "tries"} left.`, undefined, left);
  }
  const used = await db.prepare("UPDATE login_codes SET used_at = ? WHERE id = ? AND used_at IS NULL").bind(now.toISOString(), row.id).run();
  if (!used.meta.changes) throw new LoginCodeError(400, "no_code", "That code was already used. Ask for a new one.");
}

/** Delete old rows (called by the cron) so the table stays small. Keeps a day for the rate-limit window. */
export async function purgeOldCodes(db: D1Database, now: Date = new Date()) {
  await db.prepare("DELETE FROM login_codes WHERE created_at < ?").bind(new Date(now.getTime() - 86_400_000).toISOString()).run();
}
