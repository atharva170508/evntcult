/**
 * What's on at each venue (M8 Venues page). Public published events plus the viewer's own,
 * from now on. Takes the D1 database as an argument so tests can use it directly.
 */
export interface VenueEvent {
  id: string;
  slug: string;
  title: string;
  venue: string;
  startsAt: string;
  endsAt: string;
  live: boolean;
}

export async function upcomingByVenue(db: D1Database, opts: { viewerId: string | null; now?: Date }) {
  const now = opts.now ?? new Date();
  const rows = await db
    .prepare(
      `SELECT e.id, e.slug, e.title, e.venue, e.starts_at, e.ends_at
         FROM events e
        WHERE e.ends_at > ?2 AND e.status = 'published'
          AND (e.access = 'public' OR e.organizer_id = ?1
               OR EXISTS (SELECT 1 FROM registrations r WHERE r.event_id = e.id AND r.user_id = ?1 AND r.status IN ('registered','waitlisted')))
        ORDER BY e.starts_at ASC
        LIMIT 300`,
    )
    .bind(opts.viewerId, now.toISOString())
    .all<{ id: string; slug: string; title: string; venue: string; starts_at: string; ends_at: string }>();
  const map = new Map<string, VenueEvent[]>();
  for (const r of rows.results) {
    const ev: VenueEvent = { id: r.id, slug: r.slug, title: r.title, venue: r.venue, startsAt: r.starts_at, endsAt: r.ends_at, live: Date.parse(r.starts_at) <= now.getTime() };
    map.set(r.venue, [...(map.get(r.venue) ?? []), ev]);
  }
  return map;
}
