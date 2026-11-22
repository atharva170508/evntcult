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
  /** Page views for the last 14 days (IST), oldest first. */
  views: { day: string; n: number }[];
  /** Where visitors came from, all time, largest first. */
  sources: { source: string; n: number }[];
  viewsTotal: number;
  /** Post-event ratings: how many of each star, and the latest notes. */
  feedback: { dist: number[]; count: number; avg: number; notes: { name: string; rating: number; comment: string; at: string }[] };
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

  const [fDist, fNotes] = await db.batch<Record<string, unknown>>([
    db.prepare("SELECT rating, COUNT(*) AS n FROM event_feedback WHERE event_id = ? GROUP BY rating").bind(eventId),
    db
      .prepare(
        `SELECT u.name, f.rating, f.comment, f.created_at AS at FROM event_feedback f JOIN users u ON u.id = f.user_id
          WHERE f.event_id = ? AND f.comment IS NOT NULL ORDER BY f.created_at DESC LIMIT 6`,
      )
      .bind(eventId),
  ]);
  const dist = [0, 0, 0, 0, 0];
  for (const r of (fDist.results ?? []) as { rating: number; n: number }[]) dist[r.rating - 1] = r.n;
  const fCount = dist.reduce((a, b) => a + b, 0);
  const feedback = {
    dist,
    count: fCount,
    avg: fCount ? dist.reduce((a, n, i) => a + n * (i + 1), 0) / fCount : 0,
    notes: (fNotes.results ?? []) as { name: string; rating: number; comment: string; at: string }[],
  };
  const [vRows, sRows] = await db.batch<Record<string, unknown>>([
    db.prepare("SELECT day, SUM(n) AS n FROM event_views WHERE event_id = ? AND day >= date('now', '+330 minutes', '-13 days') GROUP BY day").bind(eventId),
    db.prepare("SELECT source, SUM(n) AS n FROM event_views WHERE event_id = ? GROUP BY source ORDER BY n DESC").bind(eventId),
  ]);
  const vBy = new Map(((vRows.results ?? []) as { day: string; n: number }[]).map((r) => [r.day, r.n]));
  const views: EventAnalytics["views"] = [];
  for (let i = 13; i >= 0; i--) {
    const key = new Date(now.getTime() + 330 * 60_000 - i * 86_400_000).toISOString().slice(0, 10);
    views.push({ day: key, n: vBy.get(key) ?? 0 });
  }
  const sources = (sRows.results ?? []) as { source: string; n: number }[];

  return {
    feedback,
    views,
    sources,
    viewsTotal: sources.reduce((a, b) => a + b.n, 0),
    daily,
    arrivals: (scans.results ?? []) as { at: string; n: number }[],
    tiers: (tiers.results ?? []) as { name: string; n: number }[],
    last7: sum(0, 7),
    prev7: sum(7, 14),
  };
}
