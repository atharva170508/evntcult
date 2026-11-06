import { z } from "zod";
import { run } from "@/lib/db";
import { handle, parseBody } from "@/lib/api";
import { requireUser } from "@/lib/rbac";
import { phoneSchema } from "@/lib/phone";
import { nowIso } from "@/lib/time";
import { audit } from "@/lib/audit";

export const dynamic = "force-dynamic";

/** GET /api/me — the signed-in user's own profile. */
export const GET = handle(async () => {
  const v = await requireUser();
  return Response.json({ user: { id: v.id, name: v.name, email: v.email, role: v.role, phone: v.phone, whatsapp_opt_in: v.whatsappOptIn } });
});

const patch = z.object({ phone: phoneSchema, whatsappOptIn: z.boolean() }).strict();

/** PATCH /api/me — add or change your mobile number and WhatsApp consent. */
export const PATCH = handle(async (req: Request) => {
  const v = await requireUser();
  const { phone, whatsappOptIn } = await parseBody(req, patch);
  await run("UPDATE users SET phone = ?, whatsapp_opt_in = ?, phone_updated_at = ? WHERE id = ?", phone, whatsappOptIn ? 1 : 0, nowIso(), v.id);
  await audit(v.id, "phone_update", v.id, { whatsappOptIn });
  return Response.json({ ok: true, phone, whatsapp_opt_in: whatsappOptIn });
});
