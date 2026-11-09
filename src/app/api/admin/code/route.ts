import { z } from "zod";
import { ApiError, handle, parseBody } from "@/lib/api";
import { getDB } from "@/lib/db";
import { EmailError, sendLoginCode } from "@/lib/email";
import { ADMIN_EMAIL, ADMIN_OTP_KEY, AdminError, checkAdminGate } from "@/lib/data/admin";
import { issueCode, LoginCodeError } from "@/lib/data/login-codes";
import { clientIp } from "@/lib/auth-shared";

export const dynamic = "force-dynamic";

const body = z.object({ email: z.string().max(200), code: z.string().max(200) }).strict();

/** POST /api/admin/code — owner step 1: right email + secret code emails a one-time code. */
export const POST = handle(async (req: Request) => {
  const input = await parseBody(req, body);
  const db = await getDB();
  const ip = clientIp(req);
  let issued;
  try {
    await checkAdminGate(db, { ...input, expected: process.env.ADMIN_SECRET_CODE, ip });
    issued = await issueCode(db, { email: ADMIN_OTP_KEY, ip, secret: process.env.SESSION_SECRET ?? "" });
  } catch (e) {
    if (e instanceof AdminError || e instanceof LoginCodeError) throw new ApiError(e.status, e.code, e.message);
    throw e;
  }
  try {
    // Its own settings: BREVO_API_KEY would switch code login on for every student.
    await sendLoginCode(ADMIN_EMAIL, issued.code, { BREVO_API_KEY: process.env.ADMIN_BREVO_API_KEY, EMAIL_FROM: process.env.ADMIN_EMAIL_FROM, EMAIL_PROVIDER: process.env.ADMIN_EMAIL_PROVIDER });
  } catch (e) {
    await db.prepare("DELETE FROM login_codes WHERE id = ?").bind(issued.id).run();
    if (e instanceof EmailError) throw new ApiError(502, "email_failed", e.message);
    throw e;
  }
  return Response.json({ ok: true });
});
