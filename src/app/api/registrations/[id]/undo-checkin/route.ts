import { ApiError, handle } from "@/lib/api";
import { getDB } from "@/lib/db";
import { requireEventOwner } from "@/lib/rbac";
import { registrationEvent } from "@/lib/data/organizer-actions";
import { withOrganizerActions } from "@/lib/data/organizer-api";
import { undoCheckIn } from "@/lib/data/certificates";
import { gateCounts } from "@/lib/data/checkins";
import { publishGateCounts } from "@/lib/live/publish";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/** POST: remove a mistaken check-in. Withdraws the certificates that depended on it. */
export const POST = handle(async (_req: Request, { params }: Ctx) => {
  const { id } = await params;
  const db = await getDB();
  const reg = await registrationEvent(db, id);
  if (!reg) throw new ApiError(404, "not_found", "Registration not found.");
  const viewer = await requireEventOwner(reg.event_id);
  await withOrganizerActions((d) => undoCheckIn(d, id, viewer.id));
  await publishGateCounts(reg.event_id, await gateCounts(db, reg.event_id));
  return Response.json({ ok: true });
});
