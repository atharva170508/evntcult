import "server-only";
import { all, count } from "@/lib/db";
import type { Viewer } from "@/lib/rbac";
import { detectClashes } from "@/lib/clash";
import { bufferFor } from "@/lib/venues";
import { passQrPayload } from "@/lib/tokens";
import { istYmd } from "@/lib/time";
import { SEATS_TAKEN_SQL, toSummary, type EventRowWithCount } from "./events";
import type { AnnouncementItem, DashboardData, OrganizerPanel } from "./types";

const DAY = 86_400_000;

const KIND: Record<string, { kind: AnnouncementItem["kind"]; title: string }> = {
  schedule: { kind: "SCHEDULE_CHANGE", title: "Schedule change" },
  venue: { kind: "VENUE_CHANGE", title: "Venue change" },
  update: { kind: "INFO", title: "Update" },
};

/** Every number on /dashboard comes from one of these queries. */
export async function getDashboardData(viewer: Viewer): Promise<DashboardData> {
  const now = new Date();
  const nowIso = now.toISOString();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1) - 5.5 * 3_600_000).toISOString();
  const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1) - 5.5 * 3_600_000).toISOString();

  const [mine, campus, updates, attended, photosOfYou, monthRows] = await Promise.all([
    all<EventRowWithCount & { reg_id: string; pass_code: string; pass_token: string; payment_status: string }>(
      `SELECT e.*, ${SEATS_TAKEN_SQL} AS taken, r.id AS reg_id, r.pass_code, r.pass_token, r.payment_status
         FROM registrations r JOIN events e ON e.id = r.event_id
        WHERE r.user_id = ? AND r.status = 'registered' AND e.status = 'published' AND e.ends_at > ?
        ORDER BY e.starts_at ASC`,
      viewer.id,
      nowIso,
    ),
    all<EventRowWithCount>(
      `SELECT e.*, ${SEATS_TAKEN_SQL} AS taken FROM events e
        WHERE e.status = 'published' AND e.access = 'public' AND e.ends_at > ?
          AND NOT EXISTS (SELECT 1 FROM registrations r WHERE r.event_id = e.id AND r.user_id = ? AND r.status != 'cancelled')
        ORDER BY e.starts_at ASC LIMIT 8`,
      nowIso,
      viewer.id,
    ),
    all<{ id: string; kind: string; body: string; created_at: string; title: string }>(
      `SELECT u.id, u.kind, u.body, u.created_at, e.title FROM event_updates u JOIN events e ON e.id = u.event_id
        WHERE EXISTS (SELECT 1 FROM registrations r WHERE r.event_id = u.event_id AND r.user_id = ? AND r.status = 'registered')
           OR e.organizer_id = ?
        ORDER BY u.created_at DESC LIMIT 5`,
      viewer.id,
      viewer.id,
    ),
    count(
      `SELECT COUNT(*) AS n FROM checkins c JOIN registrations r ON r.id = c.registration_id WHERE r.user_id = ?`,
      viewer.id,
    ),
    count(
      `SELECT COUNT(*) AS n FROM photo_tags t JOIN photos p ON p.id = t.photo_id
        WHERE t.user_id = ?1 AND EXISTS (SELECT 1 FROM registrations r WHERE r.event_id = p.event_id AND r.user_id = ?1 AND r.status = 'registered')`,
      viewer.id,
    ),
    all<{ starts_at: string; mine: number }>(
      `SELECT e.starts_at,
              EXISTS (SELECT 1 FROM registrations r WHERE r.event_id = e.id AND r.user_id = ? AND r.status = 'registered') AS mine
         FROM events e
        WHERE e.status = 'published' AND e.starts_at >= ? AND e.starts_at < ?
          AND (e.access = 'public' OR EXISTS (SELECT 1 FROM registrations r WHERE r.event_id = e.id AND r.user_id = ?))`,
      viewer.id,
      monthStart,
      monthEnd,
      viewer.id,
    ),
  ]);

  // A few real thumbnails for the dashboard's Vault card (same rule as the Vault page).
  const vaultPreview = photosOfYou
    ? (
        await all<{ id: string }>(
          `SELECT p.id FROM photo_tags t JOIN photos p ON p.id = t.photo_id
            WHERE t.user_id = ?1 AND EXISTS (SELECT 1 FROM registrations r WHERE r.event_id = p.event_id AND r.user_id = ?1 AND r.status = 'registered')
            ORDER BY t.created_at DESC LIMIT 6`,
          viewer.id,
        )
      ).map((r) => r.id)
    : [];

  const upcoming = mine.map(toSummary);
  const first = mine[0];
  const nextUp = first
    ? {
        ...toSummary(first),
        registrationId: first.reg_id,
        passSerial: first.pass_code,
        passToken: passQrPayload(first.pass_token),
        paymentStatus: first.price_paise === 0 ? ("NOT_REQUIRED" as const) : first.payment_status === "paid" ? ("PAID" as const) : ("PENDING" as const),
      }
    : null;

  const calendar: DashboardData["calendar"] = {};
  for (const row of monthRows) {
    const k = istYmd(new Date(row.starts_at));
    calendar[k] ??= { campus: 0, mine: 0 };
    calendar[k].campus++;
    if (row.mine) calendar[k].mine++;
  }

  return {
    stats: {
      registered: upcoming.length,
      thisWeek: upcoming.filter((e) => +e.startsAt - +now < 7 * DAY).length,
      attended,
      photosOfYou,
    },
    nextUp,
    vaultPreview,
    upcoming,
    campus: campus.map(toSummary),
    announcements: updates.map((u) => ({
      id: u.id,
      eventTitle: u.title,
      kind: (KIND[u.kind] ?? KIND.update).kind,
      title: (KIND[u.kind] ?? KIND.update).title,
      body: u.body,
      createdAt: new Date(u.created_at),
    })),
    calendar,
    organizer: viewer.verifiedOrganizer ? await getOrganizerPanel(viewer, now) : null,
  };
}

async function getOrganizerPanel(viewer: Viewer, now: Date): Promise<OrganizerPanel> {
  const nowIso = now.toISOString();
  const ownerClause = viewer.role === "admin" ? "1 = 1" : "e.organizer_id = ?";
  const ownerArgs = viewer.role === "admin" ? [] : [viewer.id];

  const hosted = await all<
    EventRowWithCount & { checked_in: number; paid: number; unpaid: number }
  >(
    `SELECT e.*, ${SEATS_TAKEN_SQL} AS taken,
            (SELECT COUNT(*) FROM checkins c WHERE c.event_id = e.id) AS checked_in,
            (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id AND r.status = 'registered' AND r.payment_status = 'paid') AS paid,
            (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id AND r.status = 'registered' AND r.payment_status = 'unpaid') AS unpaid
       FROM events e
      WHERE ${ownerClause} AND e.status IN ('published','closed') AND e.ends_at > ?
      ORDER BY e.starts_at ASC LIMIT 8`,
    ...ownerArgs,
    new Date(+now - DAY).toISOString(),
  );

  const rows = hosted.map((h) => ({
    id: h.id,
    title: h.title,
    startsAt: new Date(h.starts_at),
    status: h.status,
    capacity: h.capacity,
    registered: h.taken,
    checkedIn: h.checked_in,
    paid: h.price_paise > 0 ? h.paid : 0,
    pendingPayments: h.price_paise > 0 ? h.unpaid : 0,
    feePaise: h.price_paise,
  }));

  const liveRow = hosted.find((h) => h.starts_at <= nowIso && h.ends_at > nowIso);

  const clashes = await draftClashes(viewer, now);

  return {
    live: liveRow
      ? { id: liveRow.id, title: liveRow.title, capacity: liveRow.capacity, registered: liveRow.taken, checkedIn: liveRow.checked_in }
      : null,
    hosted: rows,
    clashes,
  };
}

/** Real clash check: each of my drafts against the published calendar. Shared with /organizer. */
export async function draftClashes(viewer: Viewer, now = new Date()): Promise<OrganizerPanel["clashes"]> {
  const nowIso = now.toISOString();
  const ownerClause = viewer.role === "admin" ? "1 = 1" : "e.organizer_id = ?";
  const ownerArgs = viewer.role === "admin" ? [] : [viewer.id];
  const drafts = await all<{ id: string; title: string; venue: string; starts_at: string; ends_at: string; category: string }>(
    `SELECT id, title, venue, starts_at, ends_at, category FROM events e WHERE ${ownerClause} AND status = 'draft' AND ends_at > ? AND venue IS NOT NULL AND category IS NOT NULL`,
    ...ownerArgs,
    nowIso,
  );
  let clashes: OrganizerPanel["clashes"] = [];
  if (drafts.length) {
    const published = await all<{ id: string; title: string; venue: string; starts_at: string; ends_at: string; status: string; category: string; capacity: number }>(
      `SELECT id, title, venue, starts_at, ends_at, status, category, capacity FROM events WHERE status = 'published' AND ends_at > ? AND venue IS NOT NULL`,
      nowIso,
    );
    const existing = published.map((p) => ({
      id: p.id,
      title: p.title,
      venueId: p.venue,
      venueName: p.venue,
      startsAt: new Date(p.starts_at),
      endsAt: new Date(p.ends_at),
      status: "PUBLISHED",
      category: p.category,
      capacity: p.capacity,
      bufferMinutes: bufferFor(p.venue),
    }));
    clashes = drafts.flatMap((d) =>
      detectClashes(
        { id: d.id, venueId: d.venue, startsAt: new Date(d.starts_at), endsAt: new Date(d.ends_at), category: d.category },
        existing,
      ).map((c) => ({ ...c, forEvent: d.title })),
    );
  }

  return clashes;
}

/** Signed-out visitors: real public data only (no personal cards). */
export async function getPublicDashboard(): Promise<{ campus: ReturnType<typeof toSummary>[]; thisWeek: number; upcoming: number; going: number; calendar: DashboardData["calendar"] }> {
  const now = new Date();
  const nowIso = now.toISOString();
  const weekEnd = new Date(+now + 7 * DAY).toISOString();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1) - 5.5 * 3_600_000).toISOString();
  const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1) - 5.5 * 3_600_000).toISOString();
  const pub = "e.status = 'published' AND e.access = 'public'";
  const [campus, thisWeek, upcoming, going, monthRows] = await Promise.all([
    all<EventRowWithCount>(`SELECT e.*, ${SEATS_TAKEN_SQL} AS taken FROM events e WHERE ${pub} AND e.ends_at > ? ORDER BY e.starts_at ASC LIMIT 8`, nowIso),
    count(`SELECT COUNT(*) AS n FROM events e WHERE ${pub} AND e.ends_at > ? AND e.starts_at < ?`, nowIso, weekEnd),
    count(`SELECT COUNT(*) AS n FROM events e WHERE ${pub} AND e.ends_at > ?`, nowIso),
    count(
      `SELECT COUNT(*) AS n FROM registrations r JOIN events e ON e.id = r.event_id WHERE ${pub} AND e.ends_at > ? AND r.status = 'registered'`,
      nowIso,
    ),
    all<{ starts_at: string }>(`SELECT e.starts_at FROM events e WHERE ${pub} AND e.starts_at >= ? AND e.starts_at < ?`, monthStart, monthEnd),
  ]);
  const calendar: DashboardData["calendar"] = {};
  for (const row of monthRows) {
    const k = istYmd(new Date(row.starts_at));
    calendar[k] ??= { campus: 0, mine: 0 };
    calendar[k].campus++;
  }
  return { campus: campus.map(toSummary), thisWeek, upcoming, going, calendar };
}
