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

export interface LandingData {
  rows: EventRow[];
  upcoming: number;
  going: number;
  checkins: number;
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
export async function getLandingData(): Promise<LandingData> {
  const now = new Date();
  const nowIso = now.toISOString();
  const pub = "e.status = 'published' AND e.access = 'public'";

  const [rows, going, checkins] = await Promise.all([
    all<EventRowWithCount>(`SELECT e.*, ${SEATS_TAKEN_SQL} AS taken FROM events e WHERE ${pub} AND e.ends_at > ? ORDER BY e.starts_at ASC LIMIT 80`, nowIso),
    count(
      `SELECT COUNT(*) AS n FROM registrations r JOIN events e ON e.id = r.event_id WHERE ${pub} AND e.ends_at > ? AND r.status = 'registered'`,
      nowIso,
    ),
    count(`SELECT COUNT(*) AS n FROM checkins`),
  ]);

  const events = rows.map(toSummary);
  const t = +now;
  const live = events.filter((e) => +e.startsAt <= t && t < +e.endsAt);
  const week = events.filter((e) => +e.startsAt > t && +e.startsAt < t + 7 * DAY);
  const popular = [...events].filter((e) => +e.startsAt > t).sort((a, b) => b.registered - a.registered);
  const free = events.filter((e) => !e.feePaise && +e.startsAt > t);

  const out: EventRow[] = [];
  if (live.length) out.push({ key: "live", title: "Happening now", href: "/events?when=today", events: live });
  if (week.length) out.push({ key: "week", title: "This week", href: "/events?when=week", events: week });
  if (popular.length >= 3) out.push({ key: "popular", title: "Popular", href: "/events", events: popular.slice(0, 12) });
  if (free.length >= 2) out.push({ key: "free", title: "Free entry", href: "/events?price=free", events: free });

  const byKind = new Map<string, EventSummary[]>();
  for (const e of events) if (KIND_TITLE[e.category]) byKind.set(e.category, [...(byKind.get(e.category) ?? []), e]);
  for (const [k, list] of [...byKind.entries()].sort((a, b) => b[1].length - a[1].length)) {
    if (list.length >= 2) out.push({ key: `kind-${k}`, title: KIND_TITLE[k], href: `/events?type=${k}`, events: list });
  }

  return { rows: out, upcoming: events.length, going, checkins };
}
