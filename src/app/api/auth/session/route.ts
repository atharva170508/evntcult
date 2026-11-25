import { z } from "zod";
import { ApiError, handle, parseBody } from "@/lib/api";
import { first } from "@/lib/db";
import { clearSessionCookieHeader } from "@/lib/session";
import { codeLoginOn } from "@/lib/email";
import { assertDomainAllowed, createUser, emailSchema, signedInResponse, signupFields } from "@/lib/auth-shared";

export const dynamic = "force-dynamic";

const body = z.object({ email: emailSchema, ...signupFields }).strict();

/**
 * POST /api/auth/session — development-only email fallback when no email provider is configured.
 * Hard-blocked in production (unless ALLOW_INSECURE_EMAIL_LOGIN=true is explicitly set) and
 * never allowed to log into organizer or admin accounts without OTP verification.
 */
export const POST = handle(async (req: Request) => {
  if (codeLoginOn()) {
    throw new ApiError(403, "code_required", "Log in with the 6-digit code we email you.");
  }
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_INSECURE_EMAIL_LOGIN !== "true") {
    throw new ApiError(403, "code_required", "Email code login must be configured in production.");
  }
  const { email, ...details } = await parseBody(req, body);
  assertDomainAllowed(email);

  const existing = await first<{ id: string; role: string }>("SELECT id, role FROM users WHERE email = ?", email);
  if (existing && (existing.role === "organizer" || existing.role === "admin")) {
    throw new ApiError(403, "code_required", "Organizer and admin accounts require 6-digit code verification.");
  }
  const userId = existing?.id ?? (await createUser(email, details));
  return signedInResponse(userId);
});

/** DELETE /api/auth/session — log out. */
export const DELETE = handle(async () => {
  const res = Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  res.headers.append("Set-Cookie", clearSessionCookieHeader());
  return res;
});
