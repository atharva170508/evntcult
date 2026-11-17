import { z } from "zod";
import { handle, parseBody } from "@/lib/api";
import { run } from "@/lib/db";
import { requireUser } from "@/lib/rbac";
import { audit } from "@/lib/audit";
import { nowIso } from "@/lib/time";
import { TERMS_VERSION } from "@/lib/terms";

export const dynamic = "force-dynamic";

const body = z.object({ accept: z.literal(true) }).strict();

/** POST /api/terms — the signed-in person accepts the current Terms & Conditions and User Rules. */
export const POST = handle(async (req: Request) => {
  const viewer = await requireUser();
  await parseBody(req, body);
  const now = nowIso();
  await run("UPDATE users SET terms_accepted_at = ?, terms_version = ? WHERE id = ?", now, TERMS_VERSION, viewer.id);
  await audit(viewer.id, "terms_accept", viewer.id, { version: TERMS_VERSION });
  return Response.json({ ok: true, version: TERMS_VERSION, acceptedAt: now });
});
