import { ADMIN_EMAIL } from "@/lib/data/admin";
import "server-only";
import { z } from "zod";
import { first, run } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { newId } from "@/lib/tokens";
import { nowIso } from "@/lib/time";
import { phoneSchema } from "@/lib/phone";
import { sessionCookieHeader, createSessionValue } from "@/lib/session";

export const emailSchema = z.string().trim().toLowerCase().email().max(200);

/** Name + number asked for when a new account is created. */
export const signupFields = {
  name: z.string().trim().min(2).max(80).optional(),
  phone: phoneSchema.optional(),
  whatsappOptIn: z.boolean().optional(),
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
export function assertSignupDetails(d: { name?: string; phone?: string }) {
  if (!d.name) throw new ApiError(400, "name_required", "Tell us your name to create your account.");
  if (!d.phone) throw new ApiError(400, "phone_required", "Add your mobile number to create your account.");
}

export async function createUser(email: string, d: { name?: string; phone?: string; whatsappOptIn?: boolean }) {
  assertSignupDetails(d);
  const id = newId();
  const now = nowIso();
  await run(
    "INSERT INTO users (id, email, name, role, created_at, phone, whatsapp_opt_in, phone_updated_at) VALUES (?, ?, ?, 'attendee', ?, ?, ?, ?)",
    id, email, d.name, now, d.phone, d.whatsappOptIn ? 1 : 0, now,
  );
  return id;
}

export async function signedInResponse(userId: string) {
  const res = Response.json({ ok: true });
  res.headers.append("Set-Cookie", sessionCookieHeader(await createSessionValue(userId)));
  return res;
}

export function clientIp(req: Request): string | null {
  return req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
}
