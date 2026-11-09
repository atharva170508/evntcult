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

const patch = z
  .object({ name: z.string().trim().min(2).max(80).optional(), phone: phoneSchema, whatsappOptIn: z.boolean() })
  .strict();

/** PATCH /api/me — change your name, mobile number and WhatsApp consent (dashboard card and /profile). */
export const PATCH = handle(async (req: Request) => {
  const v = await requireUser();
  const { name, phone, whatsappOptIn } = await parseBody(req, patch);
  const phoneChanged = phone !== v.phone || whatsappOptIn !== v.whatsappOptIn;
  await run(
    "UPDATE users SET name = COALESCE(?1, name), phone = ?2, whatsapp_opt_in = ?3, phone_updated_at = CASE WHEN ?4 THEN ?5 ELSE phone_updated_at END, wa_opt_in_at = CASE WHEN ?3 = 1 AND whatsapp_opt_in = 0 THEN ?5 ELSE wa_opt_in_at END, wa_opt_out_at = CASE WHEN ?3 = 1 THEN NULL WHEN whatsapp_opt_in = 1 THEN ?5 ELSE wa_opt_out_at END WHERE id = ?6",
    name ?? null, phone, whatsappOptIn ? 1 : 0, phoneChanged ? 1 : 0, nowIso(), v.id,
  );
  if (phoneChanged) await audit(v.id, "phone_update", v.id, { whatsappOptIn });
  if (name && name !== v.name) await audit(v.id, "profile_update", v.id, { field: "name" });
  return Response.json({ ok: true, name: name ?? v.name, phone, whatsapp_opt_in: whatsappOptIn });
});
