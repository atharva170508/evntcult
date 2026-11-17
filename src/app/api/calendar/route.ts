import { handle } from "@/lib/api";
import { getDB } from "@/lib/db";
import { getViewer } from "@/lib/rbac";
import { calendarMonth } from "@/lib/data/calendar";

export const dynamic = "force-dynamic";

/** GET /api/calendar?month=2026-11 — one month for the interactive calendar. Public events for visitors; yours too when signed in. */
export const GET = handle(async (req: Request) => {
  const month = new URL(req.url).searchParams.get("month") ?? undefined;
  const viewer = await getViewer();
  const data = await calendarMonth(await getDB(), viewer?.id ?? null, month);
  return Response.json(data, { headers: { "Cache-Control": viewer ? "private, no-store" : "public, max-age=60" } });
});
