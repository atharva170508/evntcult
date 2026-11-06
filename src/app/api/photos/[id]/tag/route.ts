import { handle, parseBody } from "@/lib/api";
import { requireUser } from "@/lib/rbac";
import { emptySchema } from "@/lib/validation";
import { setTag } from "@/lib/data/photos";
import { withPhotos } from "@/lib/data/photos-api";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/** POST /api/photos/:id/tag — "That's me". Only people registered for the event. */
export const POST = handle(async (req: Request, { params }: Ctx) => {
  const viewer = await requireUser();
  await parseBody(req, emptySchema);
  const { id } = await params;
  return Response.json(await withPhotos((db) => setTag(db, id, viewer, true)));
});

/** DELETE /api/photos/:id/tag — "Not me" (remove my tag). */
export const DELETE = handle(async (_req: Request, { params }: Ctx) => {
  const viewer = await requireUser();
  const { id } = await params;
  return Response.json(await withPhotos((db) => setTag(db, id, viewer, false)));
});
