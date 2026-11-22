import { ApiError, handle } from "@/lib/api";
import { all, first } from "@/lib/db";
import { buildCalendar } from "@/lib/ics";
import { readCalendarFeedToken } from "@/lib/session";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ token: string }> };

/**
 * GET /api/calendar/:token — the campus calendar as a live feed for Google, Apple or Outlook
 * Calendar. Every upcoming public event, plus private ones this person holds a pass for.
 */
export const GET = handle(async (req: Request, { params }: Ctx) => {
  const token = (await params).token.replace(/\.ics$/, "");
  const userId = await readCalendarFeedToken(token);
  const user = userId ? await first<{ id: string }>("SELECT id FROM users WHERE id = ?", userId) : null;
  if (!user) throw new ApiError(404, "not_found", "Calendar not found.");

  const since = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const rows = await all<{ id: string; slug: string; title: string; venue: string | null; event_type: string; starts_at: string; ends_at: string; tagline: string | null; mine: number }>(
    `SELECT e.id, e.slug, e.title, e.venue, e.event_type, e.starts_at, e.ends_at, e.tagline,
            EXISTS (SELECT 1 FROM registrations r WHERE r.event_id = e.id AND r.user_id = ?1 AND r.status = 'registered') AS mine
       FROM events e
      WHERE e.status = 'published' AND e.ends_at > ?2
        AND (e.access = 'public' OR EXISTS (SELECT 1 FROM registrations r WHERE r.event_id = e.id AND r.user_id = ?1 AND r.status = 'registered'))
      ORDER BY e.starts_at LIMIT 500`,
    user.id,
    since,
  );
  const origin = new URL(req.url).origin;
  const ics = buildCalendar(
    "EvntCult events",
    rows.map((e) => ({
      uid: `${e.id}@evntcult`,
      title: e.mine ? `✓ ${e.title}` : e.title,
      startsAt: e.starts_at,
      endsAt: e.ends_at,
      location: e.event_type === "virtual" ? "Online" : e.venue,
      description: `${e.tagline ? `${e.tagline}\n` : ""}${e.mine ? "You have a pass. " : ""}${origin}/events/${e.slug}`,
      url: `${origin}/events/${e.slug}`,
    })),
  );
  return new Response(ics, {
    headers: { "Content-Type": "text/calendar; charset=utf-8", "Cache-Control": "private, max-age=900" },
  });
});
