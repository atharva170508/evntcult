import "server-only";
import { all, count } from "@/lib/db";
import { SEATS_TAKEN_SQL, toSummary, type EventRowWithCount } from "./events";
import type { EventSummary } from "./types";

export interface EventRow {
  key: string;
  title: string;
  sub?: string;
  href: string;
  events: EventSummary[];
}

export interface KindCount {
  key: string;
  title: string;
  count: number;
  accent: string;
  seed: string;
}

export interface VenueCount {
  name: string;
  count: number;
  next: EventSummary;
}

export interface LandingData {
  rows: EventRow[];
  /** The event to feature: happening now, or the soonest one with the most demand. */
  featured: EventSummary | null;
  /** What's on next, soonest first. */
  ticker: EventSummary[];
  /** Past public events, newest first — what the page shows when nothing is scheduled. */
  recent: EventSummary[];
  kinds: KindCount[];
  venues: VenueCount[];
  upcoming: number;
  going: number;
  checkins: number;
  /** Everything upcoming, for the filterable discovery feed. */
  discover: EventSummary[];
}

const DAY = 86_400_000;
const KIND_TITLE: Record<string, string> = {
  TECH: "Tech",
  CULTURAL: "Cultural",
  SPORTS: "Sports",
  GAMING: "Gaming",
  WORKSHOP: "Workshops",
  TALK: "Talks",
  PARTY: "Parties",
};

/**
 * Everything the browse homepage shows, from one query over upcoming public events,
 * grouped into rows. No personal data; safe for signed-out visitors.
 */
export async function getLandingData({
  withPeople = false,
}: { withPeople?: boolean } = {}): Promise<LandingData> {
  const now = new Date();
  const nowIso = now.toISOString();
  const pub = "e.status = 'published' AND e.access = 'public'";

  const [rows, pastRows, going, checkins] = await Promise.all([
    all<EventRowWithCount>(
      `SELECT e.*, ${SEATS_TAKEN_SQL} AS taken FROM events e WHERE ${pub} AND e.ends_at > ? ORDER BY e.starts_at ASC LIMIT 80`,
      nowIso,
    ),
    all<EventRowWithCount>(
      `SELECT e.*, ${SEATS_TAKEN_SQL} AS taken FROM events e WHERE ${pub} AND e.ends_at <= ? ORDER BY e.starts_at DESC LIMIT 12`,
      nowIso,
    ),
    count(
      `SELECT COUNT(*) AS n FROM registrations r JOIN events e ON e.id = r.event_id WHERE ${pub} AND e.ends_at > ? AND r.status = 'registered'`,
      nowIso,
    ),
    count(`SELECT COUNT(*) AS n FROM checkins`),
  ]);

  const events = rows.map(toSummary);
  const recent = pastRows.map(toSummary);
  const t = +now;
  const live = events.filter((e) => +e.startsAt <= t && t < +e.endsAt);
  const week = events.filter(
    (e) => +e.startsAt > t && +e.startsAt < t + 7 * DAY,
  );
  const popular = [...events]
    .filter((e) => +e.startsAt > t)
    .sort((a, b) => b.registered - a.registered);
  const free = events.filter((e) => !e.feePaise && +e.startsAt > t);

  const out: EventRow[] = [];
  if (live.length)
    out.push({
      key: "live",
      title: "Happening now",
      href: "/events?when=today",
      events: live,
    });
  if (week.length)
    out.push({
      key: "week",
      title: "This week",
      href: "/events?when=week",
      events: week,
    });
  if (popular.length >= 3)
    out.push({
      key: "popular",
      title: "Popular",
      href: "/events",
      events: popular.slice(0, 12),
    });
  if (free.length >= 2)
    out.push({
      key: "free",
      title: "Free entry",
      href: "/events?price=free",
      events: free,
    });

  const byKind = new Map<string, EventSummary[]>();
  for (const e of events)
    if (KIND_TITLE[e.category])
      byKind.set(e.category, [...(byKind.get(e.category) ?? []), e]);
  for (const [k, list] of [...byKind.entries()].sort(
    (a, b) => b[1].length - a[1].length,
  )) {
    if (list.length >= 2)
      out.push({
        key: `kind-${k}`,
        title: KIND_TITLE[k],
        href: `/events?type=${k}`,
        events: list,
      });
  }

  // Featured: live now, else the most-registered event in the next 7 days, else the next one.
  const soon = events.filter(
    (e) => +e.startsAt > t && +e.startsAt < t + 7 * DAY,
  );
  const featured =
    live[0] ??
    [...soon].sort((a, b) => b.registered - a.registered)[0] ??
    events[0] ??
    null;

  // Kinds: from what's scheduled, or from recent events when the calendar is quiet.
  const kindSource =
    byKind.size >= 3 ? byKind : new Map<string, EventSummary[]>();
  if (byKind.size < 3)
    for (const e of [...events, ...recent])
      if (KIND_TITLE[e.category])
        kindSource.set(e.category, [...(kindSource.get(e.category) ?? []), e]);
  const kinds: KindCount[] = Object.entries(KIND_TITLE)
    .map(([k, title]) => {
      const list = kindSource.get(k) ?? [];
      return {
        key: k,
        title,
        count: list.length,
        accent: list[0]?.accent ?? "blue",
        seed: list[0]?.id ?? k,
      };
    })
    .filter((k) => k.count > 0)
    .sort((a, b) => b.count - a.count);

  const byVenue = new Map<string, EventSummary[]>();
  for (const e of events)
    if (e.venueName)
      byVenue.set(e.venueName, [...(byVenue.get(e.venueName) ?? []), e]);
  const venues: VenueCount[] = [...byVenue.entries()]
    .map(([name, list]) => ({ name, count: list.length, next: list[0] }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  if (recent.length)
    out.push({
      key: "recent",
      title: "Recently on campus",
      href: "/events",
      events: recent,
    });

  // A few faces per event for the discovery feed. Only for signed-in pages.
  const discover = events.slice(0, 48);
  if (withPeople && discover.length) {
    const ids = discover.map((e) => e.id);
    const faces = await all<{ event_id: string; name: string }>(
      `SELECT event_id, name FROM (
         SELECT r.event_id, u.name, ROW_NUMBER() OVER (PARTITION BY r.event_id ORDER BY r.created_at) AS n
           FROM registrations r JOIN users u ON u.id = r.user_id
          WHERE r.status = 'registered' AND r.event_id IN (${ids.map(() => "?").join(",")})
       ) WHERE n <= 3`,
      ...ids,
    );
    const by = new Map<string, string[]>();
    for (const f of faces) {
      const parts = f.name.trim().split(/\s+/);
      const ini = (
        (parts[0]?.[0] ?? "") +
        (parts.length > 1 ? parts[parts.length - 1][0] : "")
      ).toUpperCase();
      by.set(f.event_id, [...(by.get(f.event_id) ?? []), ini]);
    }
    for (const e of discover) e.going = by.get(e.id);
  }

  return {
    rows: out,
    featured,
    ticker: events.slice(0, 12),
    recent,
    kinds,
    venues,
    upcoming: events.length,
    going,
    checkins,
    discover,
  };
}
