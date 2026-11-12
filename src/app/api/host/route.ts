import { z } from "zod";
import { ApiError, handle, parseBody } from "@/lib/api";
import { getDB } from "@/lib/db";
import { requireUser } from "@/lib/rbac";
import { HostError, applyToHost, hostStatus } from "@/lib/data/hosting";

export const dynamic = "force-dynamic";

const body = z
  .object({
    club: z.string().trim().min(2, "Name the club or group you host for.").max(80),
    note: z.string().trim().min(10, "Say in a sentence what you plan to run.").max(500),
  })
  .strict();

/** GET /api/host: where my application stands. */
export const GET = handle(async () => {
  const viewer = await requireUser();
  return Response.json(await hostStatus(await getDB(), viewer.id), { headers: { "Cache-Control": "private, no-store" } });
});

/** POST /api/host { club, note }: apply to host events. An admin approves it in the owner panel. */
export const POST = handle(async (req: Request) => {
  const viewer = await requireUser();
  const input = await parseBody(req, body);
  try {
    await applyToHost(await getDB(), viewer.id, input);
  } catch (e) {
    if (e instanceof HostError) throw new ApiError(e.status, e.code, e.message);
    throw e;
  }
  return Response.json({ ok: true, status: "pending" });
});
