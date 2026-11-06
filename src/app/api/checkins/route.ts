import { handle, parseBody } from "@/lib/api";
import { getDB } from "@/lib/db";
import { requireEventOwner } from "@/lib/rbac";
import { checkinSchema } from "@/lib/validation";
import { checkIn, gateCounts } from "@/lib/data/checkins";
import { publishGateCounts } from "@/lib/live/publish";

export const dynamic = "force-dynamic";

/**
 * POST /api/checkins  { event_id, pass_token, client_scan_id, accept_unpaid?, scanned_at?, device_id? }
 *
 * Always 200 with a verdict the scanner shows as a colour:
 *   green  { result: "admitted" }            ← let them in
 *   amber  { result: "already_in", scannedAt } or { result: "unpaid", amountPaise }
 *   red    { result: "invalid", reason, message }
 * plus the gate counts. Only the event's organizer (or an admin) may scan.
 */
export const POST = handle(async (req: Request) => {
  const body = await parseBody(req, checkinSchema);
  const viewer = await requireEventOwner(body.event_id);
  const db = await getDB();

  const verdict = await checkIn(db, {
    eventId: body.event_id,
    passToken: body.pass_token,
    clientScanId: body.client_scan_id,
    acceptUnpaid: body.accept_unpaid,
    scannedAt: body.scanned_at ? new Date(body.scanned_at) : undefined,
    deviceId: body.device_id ?? null,
    actorId: viewer.id,
  });
  const counts = await gateCounts(db, body.event_id);
  if (verdict.result === "admitted" && !verdict.replay) await publishGateCounts(body.event_id, counts);

  return Response.json({ ...verdict, counts });
});
