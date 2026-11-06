import { handle } from "@/lib/api";
import { requireUser } from "@/lib/rbac";
import { cancel } from "@/lib/data/registrations";
import { withRegistrations } from "@/lib/data/registration-api";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/** DELETE /api/registrations/:id — cancel my registration or leave the waitlist. The seat goes to the next person. */
export const DELETE = handle(async (_req: Request, { params }: Ctx) => {
  const viewer = await requireUser();
  const { id } = await params;
  const reg = await withRegistrations((db) => cancel(db, id, viewer.id));
  return Response.json({ ok: true, registration: { id: reg.id, status: "cancelled" } });
});
