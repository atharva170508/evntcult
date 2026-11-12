import { ApiError, handle, parseBody } from "@/lib/api";
import { getDB } from "@/lib/db";
import { requireUser } from "@/lib/rbac";
import { listEvents } from "@/lib/data/events";
import { calendarWindow, createDraft } from "@/lib/data/organizer-events";
import { orgHandle } from "@/lib/organizer/route";
import { createDraftSchema, listQuerySchema, windowQuerySchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

/**
 * GET /api/events?type&when&price&q&cursor: public upcoming events.
 * GET /api/events?from&to: the signed-in organizer's calendar window.
 */
export const GET = handle(async (req: Request) => {
  const params = Object.fromEntries(new URL(req.url).searchParams);
  if (params.from || params.to) {
    const w = windowQuerySchema.safeParse(params);
    if (!w.success) throw new ApiError(400, "invalid", "from and to must be ISO timestamps.");
    const viewer = await requireUser();
    return Response.json(await calendarWindow(await getDB(), viewer.id, w.data.from, w.data.to), { headers: { "Cache-Control": "private, no-store" } });
  }
  const parsed = listQuerySchema.safeParse(params);
  if (!parsed.success) throw new ApiError(400, "invalid", parsed.error.issues[0]?.message ?? "Invalid filters.");
  const { events, nextCursor } = await listEvents(parsed.data);
  return Response.json({
    events: events.map((e) => ({
      id: e.id,
      slug: e.slug,
      title: e.title,
      tagline: e.tagline,
      category: e.category,
      venue: e.venueName,
      starts_at: e.startsAt.toISOString(),
      ends_at: e.endsAt.toISOString(),
      capacity: e.capacity,
      seats_left: e.capacity === null ? null : Math.max(0, e.capacity - e.registered),
      price_paise: e.feePaise,
    })),
    next_cursor: nextCursor,
  });
});

/** POST /api/events: create a draft. Approved organizers only (createDraft checks the role). */
export const POST = orgHandle(async (req: Request) => {
  const viewer = await requireUser();
  const input = await parseBody(req, createDraftSchema);
  const draft = await createDraft(await getDB(), viewer, input);
  return Response.json(draft, { status: 201 });
});
