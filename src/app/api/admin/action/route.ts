import { z } from "zod";
import { ApiError, handle, parseBody } from "@/lib/api";
import { getDB } from "@/lib/db";
import { requireOwner } from "@/lib/owner";
import { AdminError, ownerAction } from "@/lib/data/admin";
import { HostError, decideHost } from "@/lib/data/hosting";

export const dynamic = "force-dynamic";

const body = z.object({ kind: z.enum(["block", "unblock", "take_down", "restore", "approve_host", "reject_host"]), id: z.string().min(1).max(100) }).strict();

/** POST /api/admin/action — block / unblock a user, take down / restore an event, approve / reject a host application. Audited. */
export const POST = handle(async (req: Request) => {
  await requireOwner();
  const { kind, id } = await parseBody(req, body);
  try {
    if (kind === "approve_host" || kind === "reject_host") await decideHost(await getDB(), id, kind === "approve_host");
    else await ownerAction(await getDB(), kind, id);
  } catch (e) {
    if (e instanceof AdminError || e instanceof HostError) throw new ApiError(e.status, e.code, e.message);
    throw e;
  }
  return Response.json({ ok: true });
});
