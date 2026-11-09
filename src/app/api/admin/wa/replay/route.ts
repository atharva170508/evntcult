import { ApiError, handle } from "@/lib/api";
import { getDB } from "@/lib/db";
import { requireOwner } from "@/lib/owner";
import { replayDryRun } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

/** POST ?since=<ISO time>: after going live, deliver recent dry-run messages for real. */
export const POST = handle(async (req: Request) => {
  await requireOwner();
  const since = new URL(req.url).searchParams.get("since");
  if (!since || Number.isNaN(Date.parse(since))) throw new ApiError(400, "bad_since", "Give a start time.");
  return Response.json({ requeued: await replayDryRun(await getDB(), new Date(since).toISOString()) });
});
