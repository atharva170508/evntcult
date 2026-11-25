import { z } from "zod";
import { ApiError, handle, parseBody } from "@/lib/api";
import { getDB } from "@/lib/db";
import { codeLoginOn } from "@/lib/email";
import { LoginCodeError, verifyCode } from "@/lib/data/login-codes";
import { assertDomainAllowed, assertSignupDetails, createUser, emailSchema, findUserId, signedInResponse, signupFields } from "@/lib/auth-shared";

export const dynamic = "force-dynamic";

const body = z
  .object({ email: emailSchema, code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code."), ...signupFields })
  .strict();

/** POST /api/auth/verify — check the emailed code; on success set the session cookie (creating the account if new). */
export const POST = handle(async (req: Request) => {
  if (!codeLoginOn()) throw new ApiError(404, "code_login_off", "Code login isn't switched on yet.");
  const { email, code, ...details } = await parseBody(req, body);
  assertDomainAllowed(email);

  const existing = await findUserId(email);
  const needsSignup = !existing && (!details.name || !details.phone || details.acceptTerms !== true);

  // Always verify the 6-digit code FIRST so wrong codes can never enumerate registered emails.
  try {
    await verifyCode(await getDB(), {
      email,
      code,
      secret: process.env.SESSION_SECRET ?? "",
      consume: !needsSignup,
    });
  } catch (e) {
    if (e instanceof LoginCodeError) throw new ApiError(e.status, e.code, e.message);
    throw e;
  }
  if (!existing) assertSignupDetails(details);
  return signedInResponse(existing ?? (await createUser(email, details)));
});
