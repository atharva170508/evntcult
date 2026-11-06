import { z } from "zod";
import { ApiError, handle, parseBody } from "@/lib/api";
import { getDB } from "@/lib/db";
import { codeLoginOn, EmailError, sendLoginCode } from "@/lib/email";
import { CODE_TTL_MS, issueCode, LIMITS, LoginCodeError } from "@/lib/data/login-codes";
import { assertDomainAllowed, clientIp, emailSchema } from "@/lib/auth-shared";

export const dynamic = "force-dynamic";

const body = z.object({ email: emailSchema }).strict();

/**
 * POST /api/auth/code — email a fresh 6-digit login code.
 * Same answer whether or not an account exists, so nobody can probe which emails are registered.
 */
export const POST = handle(async (req: Request) => {
  if (!codeLoginOn()) throw new ApiError(404, "code_login_off", "Code login isn't switched on yet.");
  const { email } = await parseBody(req, body);
  assertDomainAllowed(email);
  const db = await getDB();
  let issued;
  try {
    issued = await issueCode(db, { email, ip: clientIp(req), secret: process.env.SESSION_SECRET ?? "" });
  } catch (e) {
    if (e instanceof LoginCodeError) {
      const res = Response.json({ error: { code: e.code, message: e.message } }, { status: e.status });
      if (e.retryAfterSec) res.headers.set("Retry-After", String(e.retryAfterSec));
      return res;
    }
    throw e;
  }
  try {
    await sendLoginCode(email, issued.code);
  } catch (e) {
    // Don't leave an unsent code around (it would count against the limits and block a retry).
    await db.prepare("DELETE FROM login_codes WHERE id = ?").bind(issued.id).run();
    if (e instanceof EmailError) throw new ApiError(502, "email_failed", e.message);
    throw e;
  }
  return Response.json({ ok: true, expiresInSec: CODE_TTL_MS / 1000, resendAfterSec: LIMITS.resendGapMs / 1000 });
});
