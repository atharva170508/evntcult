import { handle } from "@/lib/api";
import { getDB } from "@/lib/db";
import { requireUser } from "@/lib/rbac";
import { calendarMonth } from "@/lib/data/calendar";

export const dynamic = "force-dynamic";

/** GET /api/calendar?month=2026-11 — one month for the interactive calendar on the signed-in home. Signed-in people only. */
export const GET = handle(async (req: Request) => {
  const month = new URL(req.url).searchParams.get("month") ?? undefined;
  const viewer = await requireUser();
  const data = await calendarMonth(await getDB(), viewer.id, month);
  return Response.json(data, { headers: { "Cache-Control": "private, no-store" } });
});
