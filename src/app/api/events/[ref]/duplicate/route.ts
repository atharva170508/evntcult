import { duplicateEvent } from "@/lib/data/organizer-events";
import { orgHandle, ownedEvent, type RefCtx } from "@/lib/organizer/route";

export const dynamic = "force-dynamic";

/** POST /api/events/:id/duplicate: a prefilled draft. */
export const POST = orgHandle(async (_req: Request, ctx: RefCtx) => {
  const { id, viewer, db } = await ownedEvent(ctx);
  return Response.json(await duplicateEvent(db, viewer, id), { status: 201 });
});
