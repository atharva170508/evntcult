import { ApiError, handle, parseBody } from "@/lib/api";
import { getDB } from "@/lib/db";
import { requireEventOwner } from "@/lib/rbac";
import { paymentSchema } from "@/lib/validation";
import { registrationEvent, setPayment } from "@/lib/data/organizer-actions";
import { withOrganizerActions } from "@/lib/data/organizer-api";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/**
 * POST /api/registrations/:id/payment
 *   { status: "paid", method: "cash" | "upi", ref? }  or  { status: "unpaid" }   (undo)
 * Only the event's organizer (or an admin). Every change goes into audit_log.
 */
export const POST = handle(async (req: Request, { params }: Ctx) => {
  const { id } = await params;
  const body = await parseBody(req, paymentSchema);
  const reg = await registrationEvent(await getDB(), id);
  if (!reg) throw new ApiError(404, "not_found", "Registration not found.");
  const viewer = await requireEventOwner(reg.event_id);
  const result = await withOrganizerActions((db) => setPayment(db, id, viewer.id, body.status === "paid" ? { status: "paid", method: body.method, ref: body.ref } : { status: "unpaid" }));
  return Response.json({ ok: true, registration: result });
});
