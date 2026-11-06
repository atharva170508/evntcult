import { handle, parseBody } from "@/lib/api";
import { requireUser } from "@/lib/rbac";
import { emptySchema } from "@/lib/validation";
import { confirmHold } from "@/lib/data/registrations";
import { withRegistrations } from "@/lib/data/registration-api";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/** POST /api/registrations/:id/confirm — the waitlist head takes the seat being held for them. */
export const POST = handle(async (req: Request, { params }: Ctx) => {
  const viewer = await requireUser();
  await parseBody(req, emptySchema);
  const { id } = await params;
  const reg = await withRegistrations((db) => confirmHold(db, id, viewer.id));
  return Response.json({ ok: true, registration: { id: reg.id, status: "registered", pass_code: reg.pass_code } });
});
