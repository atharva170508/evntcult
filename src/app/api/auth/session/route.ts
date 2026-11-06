import { z } from "zod";
import { ApiError, handle, parseBody } from "@/lib/api";
import { clearSessionCookieHeader } from "@/lib/session";
import { codeLoginOn } from "@/lib/email";
import { assertDomainAllowed, createUser, emailSchema, findUserId, signedInResponse, signupFields } from "@/lib/auth-shared";

export const dynamic = "force-dynamic";

const body = z.object({ email: emailSchema, ...signupFields }).strict();

/**
 * POST /api/auth/session — the OLD email-only login (no check).
 * Only works while code login is off (no email provider set up yet). Once BREVO_API_KEY and
 * EMAIL_FROM are set, everyone must use /api/auth/code + /api/auth/verify instead.
 */
export const POST = handle(async (req: Request) => {
  if (codeLoginOn()) throw new ApiError(403, "code_required", "Log in with the 6-digit code we email you.");
  const { email, ...details } = await parseBody(req, body);
  assertDomainAllowed(email);
  const userId = (await findUserId(email)) ?? (await createUser(email, details));
  return signedInResponse(userId);
});

/** DELETE /api/auth/session — log out. */
export const DELETE = handle(async () => {
  const res = Response.json({ ok: true });
  res.headers.append("Set-Cookie", clearSessionCookieHeader());
  return res;
});
