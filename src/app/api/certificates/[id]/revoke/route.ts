import { z } from "zod";
import { ApiError, handle, parseBody } from "@/lib/api";
import { getDB } from "@/lib/db";
import { requireEventOwner } from "@/lib/rbac";
import { withOrganizerActions } from "@/lib/data/organizer-api";
import { certificateEvent, revokeCertificate } from "@/lib/data/certificates";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/** POST { reason? }: withdraw a certificate. It still shows at /verify, marked revoked. */
export const POST = handle(async (req: Request, { params }: Ctx) => {
  const { id } = await params;
  const { reason } = await parseBody(req, z.object({ reason: z.string().trim().max(200).optional() }).strict());
  const eventId = await certificateEvent(await getDB(), id);
  if (!eventId) throw new ApiError(404, "not_found", "Certificate not found.");
  const viewer = await requireEventOwner(eventId);
  await withOrganizerActions((db) => revokeCertificate(db, id, reason || "revoked by organizer", viewer.id));
  return Response.json({ ok: true });
});
