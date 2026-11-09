import { z } from "zod";
import { ApiError, handle, parseBody } from "@/lib/api";
import { getDB } from "@/lib/db";
import { requireOwner } from "@/lib/owner";
import { AdminError, ownerAction } from "@/lib/data/admin";

export const dynamic = "force-dynamic";

const body = z.object({ kind: z.enum(["block", "unblock", "take_down", "restore"]), id: z.string().min(1).max(100) }).strict();

/** POST /api/admin/action — block / unblock a user, take down / restore an event. Audited. */
export const POST = handle(async (req: Request) => {
  await requireOwner();
  const { kind, id } = await parseBody(req, body);
  try {
    await ownerAction(await getDB(), kind, id);
  } catch (e) {
    if (e instanceof AdminError) throw new ApiError(e.status, e.code, e.message);
    throw e;
  }
  return Response.json({ ok: true });
});
