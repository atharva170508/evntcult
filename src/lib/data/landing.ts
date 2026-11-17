import "server-only";
import { all, count } from "@/lib/db";
import { SEATS_TAKEN_SQL, toSummary, type EventRowWithCount } from "./events";
import type { EventSummary } from "./types";

export interface LandingData {
  /** Next public events by start time, live ones first: the departures board. */
  departures: EventSummary[];
  /** Upcoming public events people are registering for most. */
  popular: EventSummary[];
  upcoming: number;
  thisWeek: number;
  going: number;
  checkins: number;
}

const DAY = 86_400_000;

/** Everything the signed-out homepage shows. Public, published events only; no personal data. */
export async function getLandingData(): Promise<LandingData> {
  const now = new Date();
  const nowIso = now.toISOString();
  const weekEnd = new Date(+now + 7 * DAY).toISOString();
  const pub = "e.status = 'published' AND e.access = 'public'";

  const [departures, popular, upcoming, thisWeek, going, checkins] = await Promise.all([
    all<EventRowWithCount>(`SELECT e.*, ${SEATS_TAKEN_SQL} AS taken FROM events e WHERE ${pub} AND e.ends_at > ? ORDER BY e.starts_at ASC LIMIT 6`, nowIso),
    all<EventRowWithCount>(
      `SELECT e.*, ${SEATS_TAKEN_SQL} AS taken FROM events e WHERE ${pub} AND e.starts_at > ? ORDER BY taken DESC, e.starts_at ASC LIMIT 8`,
      nowIso,
    ),
    count(`SELECT COUNT(*) AS n FROM events e WHERE ${pub} AND e.ends_at > ?`, nowIso),
    count(`SELECT COUNT(*) AS n FROM events e WHERE ${pub} AND e.ends_at > ? AND e.starts_at < ?`, nowIso, weekEnd),
    count(
      `SELECT COUNT(*) AS n FROM registrations r JOIN events e ON e.id = r.event_id WHERE ${pub} AND e.ends_at > ? AND r.status = 'registered'`,
      nowIso,
    ),
    count(`SELECT COUNT(*) AS n FROM checkins`),
  ]);

  return { departures: departures.map(toSummary), popular: popular.map(toSummary), upcoming, thisWeek, going, checkins };
}
