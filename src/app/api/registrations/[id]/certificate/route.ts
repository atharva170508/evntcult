import { z } from "zod";
import { ApiError, handle, parseBody } from "@/lib/api";
import { getDB } from "@/lib/db";
import { requireEventOwner } from "@/lib/rbac";
import { registrationEvent } from "@/lib/data/organizer-actions";
import { withOrganizerActions } from "@/lib/data/organizer-api";
import { CERT_KINDS, issueOne } from "@/lib/data/certificates";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/** POST { kind }: one certificate for one person who checked in. */
export const POST = handle(async (req: Request, { params }: Ctx) => {
  const { id } = await params;
  const { kind } = await parseBody(req, z.object({ kind: z.enum(CERT_KINDS) }).strict());
  const reg = await registrationEvent(await getDB(), id);
  if (!reg) throw new ApiError(404, "not_found", "Registration not found.");
  const viewer = await requireEventOwner(reg.event_id);
  await withOrganizerActions((db) => issueOne(db, id, kind, viewer.id));
  return Response.json({ ok: true });
});
