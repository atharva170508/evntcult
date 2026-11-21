import "server-only";

export interface EventAnalytics {
  /** One point per day (IST) from the first sign-up to today or the event day. */
  daily: { day: string; added: number; total: number }[];
  /** Arrivals per 15 minutes (IST), from the first scan to the last. */
  arrivals: { at: string; n: number }[];
  /** Sign-ups by ticket type, largest first. */
  tiers: { name: string; n: number }[];
  last7: number;
  prev7: number;
}

const IST = "+330 minutes";

/** Everything the organizer's analytics card needs, in three small queries. */
export async function eventAnalytics(db: D1Database, eventId: string, now = new Date()): Promise<EventAnalytics> {
  const [days, scans, tiers] = await db.batch<Record<string, unknown>>([
    db
      .prepare(
        `SELECT date(created_at, '${IST}') AS day, COUNT(*) AS n FROM registrations
          WHERE event_id = ? AND status IN ('registered','waitlisted') GROUP BY day ORDER BY day`,
      )
      .bind(eventId),
    db
      .prepare(
        `SELECT strftime('%Y-%m-%dT%H:', scanned_at, '${IST}') || printf('%02d', (CAST(strftime('%M', scanned_at, '${IST}') AS INTEGER) / 15) * 15) AS at, COUNT(*) AS n
           FROM checkins WHERE event_id = ? GROUP BY at ORDER BY at`,
      )
      .bind(eventId),
    db
      .prepare("SELECT tier AS name, COUNT(*) AS n FROM registrations WHERE event_id = ? AND tier IS NOT NULL AND status IN ('registered','waitlisted') GROUP BY tier ORDER BY n DESC")
      .bind(eventId),
  ]);

  // Fill missing days so the line doesn't skip.
  const rows = (days.results ?? []) as { day: string; n: number }[];
  const daily: EventAnalytics["daily"] = [];
  if (rows.length) {
    const by = new Map(rows.map((r) => [r.day, r.n]));
    const today = new Date(now.getTime() + 330 * 60_000).toISOString().slice(0, 10);
    const last = rows[rows.length - 1].day > today ? rows[rows.length - 1].day : today;
    let total = 0;
    for (let d = new Date(`${rows[0].day}T00:00:00Z`); d.toISOString().slice(0, 10) <= last && daily.length < 120; d.setUTCDate(d.getUTCDate() + 1)) {
      const key = d.toISOString().slice(0, 10);
      const added = by.get(key) ?? 0;
      total += added;
      daily.push({ day: key, added, total });
    }
    // Keep the last 60 days at most; the total stays cumulative from the start.
    if (daily.length > 60) daily.splice(0, daily.length - 60);
  }
  const sum = (from: number, to: number) => daily.slice(Math.max(0, daily.length - to), Math.max(0, daily.length - from)).reduce((s, d) => s + d.added, 0);

  return {
    daily,
    arrivals: (scans.results ?? []) as { at: string; n: number }[],
    tiers: (tiers.results ?? []) as { name: string; n: number }[],
    last7: sum(0, 7),
    prev7: sum(7, 14),
  };
}
