import { z } from "zod";
import { ApiError, handle, parseBody } from "@/lib/api";
import { getDB } from "@/lib/db";
import { ADMIN_OTP_KEY } from "@/lib/data/admin";
import { LoginCodeError, verifyCode } from "@/lib/data/login-codes";
import { adminCookieHeader, clearAdminCookieHeader, createAdminValue } from "@/lib/session";

export const dynamic = "force-dynamic";

const body = z.object({ otp: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code.") }).strict();

/** POST /api/admin/session — owner step 2: the emailed code opens the panel. */
export const POST = handle(async (req: Request) => {
  const { otp } = await parseBody(req, body);
  try {
    await verifyCode(await getDB(), { email: ADMIN_OTP_KEY, code: otp, secret: process.env.SESSION_SECRET ?? "" });
  } catch (e) {
    if (e instanceof LoginCodeError) throw new ApiError(e.status, e.code, e.message);
    throw e;
  }
  const res = Response.json({ ok: true });
  res.headers.append("Set-Cookie", adminCookieHeader(await createAdminValue()));
  return res;
});

/** DELETE /api/admin/session — lock the panel again. */
export const DELETE = handle(async () => {
  const res = Response.json({ ok: true });
  res.headers.append("Set-Cookie", clearAdminCookieHeader());
  return res;
});
