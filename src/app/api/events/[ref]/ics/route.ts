import { ApiError, handle } from "@/lib/api";
import { first } from "@/lib/db";
import { buildIcs, icsFileName } from "@/lib/ics";
import { requireUser } from "@/lib/rbac";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ ref: string }> };

/** GET /api/events/:slug/ics — "Add to calendar" for a published public event (signed-in, like event pages). */
export const GET = handle(async (req: Request, { params }: Ctx) => {
  await requireUser();
  const { ref } = await params;
  const e = await first<{ id: string; slug: string; title: string; venue: string | null; event_type: string; starts_at: string; ends_at: string; tagline: string | null }>(
    `SELECT id, slug, title, venue, event_type, starts_at, ends_at, tagline FROM events
      WHERE (slug = ? OR id = ?) AND status = 'published' AND access = 'public'`,
    ref,
    ref,
  );
  if (!e) throw new ApiError(404, "not_found", "Event not found.");

  const url = new URL(`/events/${e.slug}`, req.url).toString();
  const ics = buildIcs({
    uid: `${e.id}@evntcult`,
    title: e.title,
    startsAt: e.starts_at,
    endsAt: e.ends_at,
    location: e.event_type === "virtual" ? "Online" : e.venue,
    description: `${e.tagline ? `${e.tagline}\n` : ""}Register and get your pass: ${url}`,
    url,
  });
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${icsFileName(e.title)}"`,
      "Cache-Control": "private, max-age=300",
    },
  });
});
