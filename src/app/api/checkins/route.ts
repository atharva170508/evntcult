import { handle, parseBody } from "@/lib/api";
import { getDB } from "@/lib/db";
import { requireGateAccess, touchVolunteer } from "@/lib/volunteers";
import { checkinSchema } from "@/lib/validation";
import { checkIn, gateCounts } from "@/lib/data/checkins";
import { publishGateCounts } from "@/lib/live/publish";
import { passMerch } from "@/lib/data/merch";

export const dynamic = "force-dynamic";

/**
 * POST /api/checkins  { event_id, pass_token, client_scan_id, accept_unpaid?, scanned_at?, device_id? }
 *
 * Always 200 with a verdict the scanner shows as a colour:
 *   green  { result: "admitted" }            ← let them in
 *   amber  { result: "already_in", scannedAt } or { result: "unpaid", amountPaise }
 *   red    { result: "invalid", reason, message }
 * plus the gate counts. The event's organizer, an admin, or a volunteer with a live link may scan.
 */
export const POST = handle(async (req: Request) => {
  const body = await parseBody(req, checkinSchema);
  const actor = await requireGateAccess(body.event_id);
  const db = await getDB();

  const verdict = await checkIn(db, {
    eventId: body.event_id,
    passToken: body.pass_token,
    clientScanId: body.client_scan_id,
    acceptUnpaid: body.accept_unpaid,
    scannedAt: body.scanned_at ? new Date(body.scanned_at) : undefined,
    deviceId: actor.volunteer ? `vol:${actor.volunteer.id}` : (body.device_id ?? null),
    actorId: actor.actorId,
  });
  const counts = await gateCounts(db, body.event_id);
  if (verdict.result === "admitted" && !verdict.replay) await publishGateCounts(body.event_id, counts);

  if (actor.volunteer) await touchVolunteer(actor.volunteer.id, verdict.result === "admitted" && !verdict.replay);
  // Entry-only volunteers don't see merch buttons they can't use.
  const canMerch = !actor.volunteer || actor.volunteer.role === "gate_merch";
  const merch = canMerch && (verdict.result === "admitted" || verdict.result === "already_in") ? await passMerch(db, body.event_id, body.pass_token) : [];
  return Response.json({ ...verdict, counts, merch });
});
