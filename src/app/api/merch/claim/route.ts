import { z } from "zod";
import { ApiError, handle, parseBody } from "@/lib/api";
import { getDB } from "@/lib/db";
import { requireEventOwner } from "@/lib/rbac";
import { claimMerch, merchItemEvent } from "@/lib/data/merch";

export const dynamic = "force-dynamic";

const body = z.object({ token: z.string().trim().min(1).max(200), item_id: z.string().trim().min(1).max(64), client_claim_id: z.string().trim().min(8).max(64), claimed_at: z.string().datetime().optional() }).strict();

/** POST: give one item to one pass. Always 200 with a result, like the gate scanner. */
export const POST = handle(async (req: Request) => {
  const b = await parseBody(req, body);
  const db = await getDB();
  const eventId = await merchItemEvent(db, b.item_id);
  if (!eventId) throw new ApiError(404, "not_found", "That item no longer exists.");
  const viewer = await requireEventOwner(eventId);
  return Response.json(await claimMerch(db, { token: b.token, itemId: b.item_id, clientClaimId: b.client_claim_id, actorId: viewer.id, claimedAt: b.claimed_at ? new Date(b.claimed_at) : undefined }));
});
