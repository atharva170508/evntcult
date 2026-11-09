import { handle, parseBody } from "@/lib/api";
import { requireUser } from "@/lib/rbac";
import { upiClaimSchema } from "@/lib/validation";
import { claimUpiPayment } from "@/lib/data/organizer-actions";
import { withOrganizerActions } from "@/lib/data/organizer-api";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/** POST /api/registrations/:id/upi { utr } — the student says they paid. The organizer still has to confirm. */
export const POST = handle(async (req: Request, { params }: Ctx) => {
  const viewer = await requireUser();
  const { utr } = await parseBody(req, upiClaimSchema);
  const { id } = await params;
  await withOrganizerActions((db) => claimUpiPayment(db, id, viewer.id, utr));
  return Response.json({ ok: true });
});
