import { parseBody } from "@/lib/api";
import { publishEvent } from "@/lib/data/organizer-events";
import { orgHandle, ownedEvent, type RefCtx } from "@/lib/organizer/route";
import { versionSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

/** POST /api/events/:id/publish */
export const POST = orgHandle(async (req: Request, ctx: RefCtx) => {
  const { id, viewer, db } = await ownedEvent(ctx);
  const body = await parseBody(req, versionSchema);
  return Response.json(await publishEvent(db, viewer, id, body.version, { acknowledgeSoftClashes: body.acknowledgeSoftClashes }));
});
