import { ADMIN_EMAIL } from "@/lib/data/admin";
import "server-only";
import { z } from "zod";
import { first, run } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { newId } from "@/lib/tokens";
import { nowIso } from "@/lib/time";
import { phoneSchema } from "@/lib/phone";
import { sessionCookieHeader, createSessionValue } from "@/lib/session";
import { TERMS_VERSION } from "@/lib/terms";

export const emailSchema = z.string().trim().toLowerCase().email().max(200);

/** Name + number asked for when a new account is created. */
export const signupFields = {
  name: z.string().trim().min(2).max(80).optional(),
  phone: phoneSchema.optional(),
  whatsappOptIn: z.boolean().optional(),
  /** The sign-up checkbox: "I have read, understand, and agree to the Terms & Conditions and User Rules". */
  acceptTerms: z.boolean().optional(),
};

export function assertDomainAllowed(email: string) {
  if (email.trim().toLowerCase() === ADMIN_EMAIL) throw new ApiError(403, "owner_email", "This email can only open the owner panel.");
  const list = (process.env.ALLOWED_EMAIL_DOMAINS ?? "")
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
  if (list.length > 0 && !list.includes(email.split("@")[1] ?? "")) throw new ApiError(403, "domain_not_allowed", "That email domain isn't allowed.");
}

export async function findUserId(email: string) {
  return (await first<{ id: string }>("SELECT id FROM users WHERE email = ?", email))?.id ?? null;
}

/** Throws name_required / phone_required if a new account is missing details (checked before any code try is used up). */
export function assertSignupDetails(d: { name?: string; phone?: string; acceptTerms?: boolean }) {
  if (!d.name) throw new ApiError(400, "name_required", "Tell us your name to create your account.");
  if (!d.phone) throw new ApiError(400, "phone_required", "Add your mobile number to create your account.");
  if (d.acceptTerms !== true) throw new ApiError(400, "terms_required", "Tick the box to agree to the Terms & Conditions and User Rules.");
}

export async function createUser(email: string, d: { name?: string; phone?: string; whatsappOptIn?: boolean; acceptTerms?: boolean }) {
  assertSignupDetails(d);
  const id = newId();
  const now = nowIso();
  await run(
    "INSERT INTO users (id, email, name, role, created_at, phone, whatsapp_opt_in, phone_updated_at, wa_opt_in_at, terms_accepted_at, terms_version) VALUES (?, ?, ?, 'attendee', ?, ?, ?, ?, ?, ?, ?)",
    id, email, d.name, now, d.phone, d.whatsappOptIn ? 1 : 0, now, d.whatsappOptIn ? now : null, now, TERMS_VERSION,
  );
  return id;
}

/** Rejects external, protocol-relative (// or /\), or control-char open redirects. */
export function safeNextPath(raw: string | undefined | null, fallback = "/dashboard"): string {
  if (!raw) return fallback;
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return fallback;
  if (/[\u0000-\u001f\u007f\\]/.test(raw)) return fallback;
  return raw;
}

export async function signedInResponse(userId: string) {
  const user = await first<{ has_face_id: number; blocked_at: string | null }>(
    "SELECT (face_embedding IS NOT NULL) AS has_face_id, blocked_at FROM users WHERE id = ?",
    userId,
  );
  if (!user || user.blocked_at) {
    throw new ApiError(403, "account_blocked", "This account has been suspended.");
  }
  const res = Response.json(
    { ok: true, hasFaceId: Boolean(user.has_face_id) },
    { headers: { "Cache-Control": "no-store" } },
  );
  res.headers.append("Set-Cookie", sessionCookieHeader(await createSessionValue(userId)));
  return res;
}

export function clientIp(req: Request): string | null {
  return req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
}
