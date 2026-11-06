import { ApiError, handle, parseBody } from "@/lib/api";
import { requireOrganizer, requireUser } from "@/lib/rbac";
import { listEvents } from "@/lib/data/events";
import { createEvent } from "@/lib/data/event-write";
import { createEventSchema, listQuerySchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

/** GET /api/events?type&when&price&q&cursor */
export const GET = handle(async (req: Request) => {
  await requireUser();
  const params = Object.fromEntries(new URL(req.url).searchParams);
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
      seats_left: Math.max(0, (e.capacity ?? 0) - e.registered),
      price_paise: e.feePaise,
    })),
    next_cursor: nextCursor,
  });
});

/** POST /api/events — organizers only. */
export const POST = handle(async (req: Request) => {
  const viewer = await requireOrganizer();
  const input = await parseBody(req, createEventSchema);
  const e = await createEvent(viewer, input);
  return Response.json({ event: { id: e.id, slug: e.slug, status: e.status, access_code: e.access_code } }, { status: 201 });
});
