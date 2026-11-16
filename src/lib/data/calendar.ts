/**
 * Campus calendar (M8): every event a person may see in one IST month.
 *
 * Visible to everyone: published or closed PUBLIC events.
 * Also visible to a signed-in person: events they registered for or are waitlisted on
 * (including private code-only ones and cancelled ones, so they notice), and every
 * non-cancelled event they organize (drafts included, marked as drafts).
 *
 * Takes the D1 database as an argument (no "server-only") so tests can use it directly.
 */

export interface CalendarEvent {
  id: string;
  slug: string;
  title: string;
  category: string;
  venue: string;
  startsAt: string;
  endsAt: string;
  status: "draft" | "published" | "closed" | "cancelled";
  access: "public" | "code";
  pricePaise: number;
  /** The viewer's own place on this event, if any. */
  mine: "registered" | "waitlisted" | null;
  hosting: boolean;
  /** IST day (yyyy-mm-dd) the event starts on. */
  day: string;
}

const IST_OFFSET_MS = 5.5 * 3_600_000;

/** "2026-11" -> UTC instants of 1 Nov 00:00 IST and 1 Dec 00:00 IST. Falls back to the current IST month. */
export function monthRange(ym: string | undefined, now: Date = new Date()) {
  let y: number, m: number; // m is 0-based
  const match = ym?.match(/^(\d{4})-(\d{2})$/);
  if (match && +match[2] >= 1 && +match[2] <= 12 && +match[1] >= 2000 && +match[1] <= 2100) {
    y = +match[1];
    m = +match[2] - 1;
  } else {
    const ist = new Date(now.getTime() + IST_OFFSET_MS);
    y = ist.getUTCFullYear();
    m = ist.getUTCMonth();
  }
  const start = new Date(Date.UTC(y, m, 1) - IST_OFFSET_MS);
  const end = new Date(Date.UTC(y, m + 1, 1) - IST_OFFSET_MS);
  const key = (yy: number, mm: number) => {
    const d = new Date(Date.UTC(yy, mm, 1));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  };
  return { year: y, month: m, start, end, key: key(y, m), prev: key(y, m - 1), next: key(y, m + 1) };
}

const istDay = (iso: string) => new Date(Date.parse(iso) + IST_OFFSET_MS).toISOString().slice(0, 10);

export async function monthEvents(db: D1Database, opts: { viewerId: string | null; start: Date; end: Date; onlyMine?: boolean }): Promise<CalendarEvent[]> {
  const rows = await db
    .prepare(
      `SELECT e.id, e.slug, e.title, COALESCE(e.category, 'TALK') AS category, COALESCE(e.venue, 'TBA') AS venue, e.starts_at, e.ends_at, e.status, e.access, e.price_paise,
              (e.organizer_id = ?1) AS hosting,
              (SELECT r.status FROM registrations r
                WHERE r.event_id = e.id AND r.user_id = ?1 AND r.status IN ('registered','waitlisted')) AS my_status
         FROM events e
        WHERE e.starts_at < ?3 AND e.ends_at > ?2
          AND (
                (e.status IN ('published','closed') AND e.access = 'public')
             OR (?1 IS NOT NULL AND e.organizer_id = ?1 AND e.status != 'cancelled')
             OR (?1 IS NOT NULL AND e.status != 'draft' AND EXISTS (
                   SELECT 1 FROM registrations r WHERE r.event_id = e.id AND r.user_id = ?1 AND r.status IN ('registered','waitlisted')))
              )
        ORDER BY e.starts_at ASC, e.title ASC
        LIMIT 500`,
    )
    .bind(opts.viewerId, opts.start.toISOString(), opts.end.toISOString())
    .all<{
      id: string;
      slug: string;
      title: string;
      category: string;
      venue: string;
      starts_at: string;
      ends_at: string;
      status: CalendarEvent["status"];
      access: CalendarEvent["access"];
      price_paise: number;
      hosting: number | null;
      my_status: CalendarEvent["mine"];
    }>();

  const events = rows.results.map((r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    category: r.category,
    venue: r.venue,
    startsAt: r.starts_at,
    endsAt: r.ends_at,
    status: r.status,
    access: r.access,
    pricePaise: r.price_paise,
    mine: r.my_status ?? null,
    hosting: r.hosting === 1,
    day: istDay(r.starts_at),
  }));
  return opts.onlyMine ? events.filter((e) => e.mine || e.hosting) : events;
}

/** Monday-first month grid: null for the blank cells before day 1 and after the last day. */
export function monthGrid(year: number, month: number): (string | null)[] {
  const first = new Date(Date.UTC(year, month, 1));
  const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const lead = (first.getUTCDay() + 6) % 7;
  const cells: (string | null)[] = Array(lead).fill(null);
  for (let d = 1; d <= days; d++) cells.push(`${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
  while (cells.length % 7) cells.push(null);
  return cells;
}
