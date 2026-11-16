import { z } from "zod";
import { ApiError, handle, parseBody } from "@/lib/api";
import { getDB } from "@/lib/db";
import { AdminError, checkAdminGate } from "@/lib/data/admin";
import { clientIp } from "@/lib/auth-shared";
import { adminCookieHeader, clearAdminCookieHeader, createAdminValue } from "@/lib/session";

export const dynamic = "force-dynamic";

const body = z.object({ email: z.string().max(200), code: z.string().max(200) }).strict();

/** POST /api/admin/session — the owner email and secret code open the panel. */
export const POST = handle(async (req: Request) => {
  const input = await parseBody(req, body);
  try {
    await checkAdminGate(await getDB(), { ...input, expected: process.env.ADMIN_SECRET_CODE, ip: clientIp(req) });
  } catch (e) {
    if (e instanceof AdminError) throw new ApiError(e.status, e.code, e.message);
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
