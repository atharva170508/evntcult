/**
 * Registration, waitlist and seat holds. The single place that changes seats.
 *
 * Every function takes the D1 database as its first argument (not via getDB()),
 * so the same code runs in API routes, in the cron worker (worker.ts) and in tests.
 * No "server-only" import for the same reason. Never import this into a client component.
 *
 * Rules
 *  • Seats taken = registered + waitlisted (same as SEATS_TAKEN_SQL). Because waitlisted
 *    people count, a newcomer can never take a freed seat ahead of the queue.
 *  • Every seat decision is ONE SQL statement with the capacity check inside it,
 *    so two people clicking at the same moment can never both get the last seat.
 *  • A freed seat becomes a HOLD for the waitlist head (oldest first). The holder has
 *    until hold_expires_at to confirm; otherwise the cron cancels their spot and the
 *    seat moves to the next person.
 */
import { newId, newPassToken } from "@/lib/tokens";

export const HOLD_MS = 2 * 60 * 60 * 1000; // 2 hours to confirm a held seat…
export const MIN_HOLD_MS = 20 * 60 * 1000; // …but never less than 20 minutes,
// and never past the event's start (unless that is less than 20 minutes away).

export type RegStatus = "registered" | "waitlisted" | "cancelled";

/** The event fields this module needs. */
export interface EventForRegistration {
  id: string;
  slug: string;
  capacity: number;
  status: string;
  starts_at: string;
  ends_at: string;
}

export interface RegistrationRow {
  id: string;
  event_id: string;
  user_id: string;
  status: RegStatus;
  pass_code: string;
  pass_token: string;
  payment_status: "unpaid" | "paid";
  hold_expires_at: string | null;
  created_at: string;
  cancelled_at: string | null;
}

/** A rule was broken. API routes turn this into { error: { code, message } }. */
export class RegistrationError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export type RegisterResult =
  | { kind: "registered"; registration: RegistrationRow }
  | { kind: "waitlisted"; registration: RegistrationRow; position: number }
  /** Event is full and the user hasn't agreed to join the waitlist yet. */
  | { kind: "full"; position: number };

const iso = (d: Date) => d.toISOString();

/** When a hold given at `now` runs out. */
export function holdExpiry(now: Date, startsAt: string, endsAt: string): string {
  const t = now.getTime();
  const start = Date.parse(startsAt);
  const end = Date.parse(endsAt);
  let until = Math.min(t + HOLD_MS, Math.max(start, t + MIN_HOLD_MS));
  until = Math.min(until, end);
  return new Date(until).toISOString();
}

/** "EC-VALO-" — the number is added inside the INSERT so it can't race. */
function passCodePrefix(slug: string) {
  const p = slug.replace(/[^a-z0-9]/gi, "").slice(0, 4).toUpperCase() || "EVNT";
  return `EC-${p}-`;
}

async function audit(db: D1Database, actorId: string | null, action: string, targetId: string, meta?: Record<string, unknown>, now = new Date()) {
  await db
    .prepare("INSERT INTO audit_log (id, actor_id, action, target_id, meta, created_at) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(newId(), actorId, action, targetId, meta ? JSON.stringify(meta) : null, iso(now))
    .run();
}

export async function getRegistration(db: D1Database, id: string): Promise<RegistrationRow | null> {
  return (await db.prepare("SELECT * FROM registrations WHERE id = ?").bind(id).first<RegistrationRow>()) ?? null;
}

async function findMine(db: D1Database, eventId: string, userId: string) {
  return (
    (await db.prepare("SELECT * FROM registrations WHERE event_id = ? AND user_id = ?").bind(eventId, userId).first<RegistrationRow>()) ?? null
  );
}

/** 1-based place in the queue (oldest first). */
export async function waitlistPosition(db: D1Database, reg: Pick<RegistrationRow, "id" | "event_id" | "created_at">): Promise<number> {
  const row = await db
    .prepare(
      `SELECT COUNT(*) AS n FROM registrations
        WHERE event_id = ? AND status = 'waitlisted' AND (created_at < ? OR (created_at = ? AND id <= ?))`,
    )
    .bind(reg.event_id, reg.created_at, reg.created_at, reg.id)
    .first<{ n: number }>();
  return row?.n ?? 1;
}

async function waitlistLength(db: D1Database, eventId: string) {
  const row = await db.prepare("SELECT COUNT(*) AS n FROM registrations WHERE event_id = ? AND status = 'waitlisted'").bind(eventId).first<{ n: number }>();
  return row?.n ?? 0;
}

/**
 * Insert (or revive a cancelled) registration in one statement.
 * `withCapacityCheck` adds "seats taken < capacity" to the same statement.
 * Returns the number of rows changed (0 = full, or the user already has an active row).
 */
async function upsertRegistration(
  db: D1Database,
  event: EventForRegistration,
  userId: string,
  status: "registered" | "waitlisted",
  withCapacityCheck: boolean,
  now: Date,
): Promise<number> {
  const capacity = withCapacityCheck
    ? "AND (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id AND r.status IN ('registered','waitlisted')) < e.capacity"
    : "";
  // The display number continues across every event that shares this 4-letter prefix
  // (robowars / robotics both give "EC-ROBO-"), so codes are unique by construction.
  // It is computed inside the INSERT, so two people registering at once can't get the same one.
  const res = await db
    .prepare(
      `INSERT INTO registrations (id, event_id, user_id, status, pass_code, pass_token, payment_status, created_at)
       SELECT ?1, e.id, ?2, ?3,
              ?4 || printf('%04d', 1 + COALESCE((SELECT MAX(CAST(substr(x.pass_code, length(?4) + 1) AS INTEGER))
                                                    FROM registrations x WHERE x.pass_code >= ?4 AND x.pass_code < ?4 || '~'), 0)),
              ?5, 'unpaid', ?6
         FROM events e
        WHERE e.id = ?7 AND e.status = 'published' AND e.ends_at > ?6 ${capacity}
       ON CONFLICT (event_id, user_id) DO UPDATE SET
              status = excluded.status, pass_token = excluded.pass_token, payment_status = 'unpaid',
              hold_expires_at = NULL, cancelled_at = NULL, created_at = excluded.created_at
        WHERE registrations.status = 'cancelled'`,
    )
    .bind(newId(), userId, status, passCodePrefix(event.slug), newPassToken(), iso(now), event.id)
    .run();
  return res.meta.changes ?? 0;
}

/**
 * Register for an event.
 *  1. Try to take a seat (atomic capacity check).
 *  2. If full: with waitlist=false, report "full, you'd be #N"; with waitlist=true, join the queue.
 * Calling it twice is safe: the second call returns the existing registration.
 */
export async function register(
  db: D1Database,
  event: EventForRegistration,
  userId: string,
  opts: { waitlist?: boolean; now?: Date } = {},
): Promise<RegisterResult> {
  const now = opts.now ?? new Date();
  if (event.status !== "published") throw new RegistrationError(409, "not_open", "Registration isn't open for this event.");
  if (Date.parse(event.ends_at) <= now.getTime()) throw new RegistrationError(409, "ended", "This event has ended.");

  const existing = await findMine(db, event.id, userId);
  if (existing && existing.status !== "cancelled") return describe(db, existing);

  // Free seats may be waiting for the next person (e.g. the organizer raised capacity).
  await promoteWaitlist(db, event.id, now);

  if ((await upsertRegistration(db, event, userId, "registered", true, now)) === 1) {
    const reg = (await findMine(db, event.id, userId))!;
    await audit(db, userId, "register", reg.id, { event_id: event.id, status: "registered" }, now);
    return { kind: "registered", registration: reg };
  }

  // 0 rows: the event is full, or a double-click already registered this user.
  const again = await findMine(db, event.id, userId);
  if (again && again.status !== "cancelled") return describe(db, again);

  if (!opts.waitlist) return { kind: "full", position: (await waitlistLength(db, event.id)) + 1 };

  if ((await upsertRegistration(db, event, userId, "waitlisted", false, now)) === 0) {
    const raced = await findMine(db, event.id, userId);
    if (raced && raced.status !== "cancelled") return describe(db, raced);
    throw new RegistrationError(409, "not_open", "Registration isn't open for this event.");
  }
  const reg = (await findMine(db, event.id, userId))!;
  await audit(db, userId, "register", reg.id, { event_id: event.id, status: "waitlisted" }, now);
  // A seat might have opened between the two statements; if so this person gets a hold.
  await promoteWaitlist(db, event.id, now);
  const fresh = (await getRegistration(db, reg.id))!;
  return { kind: "waitlisted", registration: fresh, position: await waitlistPosition(db, fresh) };
}

async function describe(db: D1Database, reg: RegistrationRow): Promise<RegisterResult> {
  if (reg.status === "waitlisted") return { kind: "waitlisted", registration: reg, position: await waitlistPosition(db, reg) };
  return { kind: "registered", registration: reg };
}

/**
 * Hand free seats to the waitlist, oldest first, as holds.
 * Free seats = capacity − registered − people already holding a seat.
 * Each hand-over is one guarded UPDATE, so running this twice at once can't over-assign.
 * Returns the registrations that just got a hold (for notifications in M4).
 */
export async function promoteWaitlist(db: D1Database, eventId: string, now = new Date()): Promise<RegistrationRow[]> {
  const event = await db
    .prepare("SELECT id, capacity, status, starts_at, ends_at FROM events WHERE id = ?")
    .bind(eventId)
    .first<{ id: string; capacity: number; status: string; starts_at: string; ends_at: string }>();
  if (!event || event.status !== "published" || Date.parse(event.ends_at) <= now.getTime()) return [];

  const promoted: RegistrationRow[] = [];
  for (let i = 0; i < 10_000; i++) {
    const head = await db
      .prepare(
        `SELECT * FROM registrations WHERE event_id = ? AND status = 'waitlisted' AND hold_expires_at IS NULL
          ORDER BY created_at, id LIMIT 1`,
      )
      .bind(eventId)
      .first<RegistrationRow>();
    if (!head) break;

    const res = await db
      .prepare(
        `UPDATE registrations SET hold_expires_at = ?
          WHERE id = ? AND status = 'waitlisted' AND hold_expires_at IS NULL
            AND (SELECT COUNT(*) FROM registrations r
                  WHERE r.event_id = ? AND (r.status = 'registered' OR (r.status = 'waitlisted' AND r.hold_expires_at IS NOT NULL)))
                < (SELECT capacity FROM events WHERE id = ?)`,
      )
      .bind(holdExpiry(now, event.starts_at, event.ends_at), head.id, eventId, eventId)
      .run();
    if ((res.meta.changes ?? 0) === 0) break; // no free seat (or someone else just promoted this person)
    const held = (await getRegistration(db, head.id))!;
    promoted.push(held);
    await audit(db, null, "hold_offered", held.id, { event_id: eventId, until: held.hold_expires_at }, now);
  }
  return promoted;
}

/** Cancel my registration or leave the waitlist. Frees the seat for the next person in line. */
export async function cancel(db: D1Database, regId: string, userId: string, now = new Date()): Promise<RegistrationRow> {
  const res = await db
    .prepare(
      `UPDATE registrations SET status = 'cancelled', cancelled_at = ?, hold_expires_at = NULL
        WHERE id = ? AND user_id = ? AND status IN ('registered','waitlisted')
          AND NOT EXISTS (SELECT 1 FROM checkins c WHERE c.registration_id = registrations.id)
          AND (SELECT ends_at FROM events WHERE id = registrations.event_id) > ?`,
    )
    .bind(iso(now), regId, userId, iso(now))
    .run();

  const reg = await getRegistration(db, regId);
  if (!reg || reg.user_id !== userId) throw new RegistrationError(404, "not_found", "Registration not found.");
  if ((res.meta.changes ?? 0) === 0) {
    if (reg.status === "cancelled") throw new RegistrationError(409, "already_cancelled", "This registration is already cancelled.");
    const checkedIn = await db.prepare("SELECT 1 AS x FROM checkins WHERE registration_id = ?").bind(regId).first();
    if (checkedIn) throw new RegistrationError(409, "checked_in", "You've already checked in, so this can't be cancelled.");
    throw new RegistrationError(409, "ended", "This event has ended.");
  }
  await audit(db, userId, "cancel", regId, { event_id: reg.event_id }, now);
  await promoteWaitlist(db, reg.event_id, now);
  return reg;
}

/** The waitlist head takes their held seat. */
export async function confirmHold(db: D1Database, regId: string, userId: string, now = new Date()): Promise<RegistrationRow> {
  const res = await db
    .prepare(
      `UPDATE registrations SET status = 'registered', hold_expires_at = NULL
        WHERE id = ? AND user_id = ? AND status = 'waitlisted' AND hold_expires_at IS NOT NULL AND hold_expires_at > ?`,
    )
    .bind(regId, userId, iso(now))
    .run();
  const reg = await getRegistration(db, regId);
  if (!reg || reg.user_id !== userId) throw new RegistrationError(404, "not_found", "Registration not found.");
  if ((res.meta.changes ?? 0) === 0) {
    if (reg.status === "registered") return reg; // double-click: already confirmed
    if (reg.status === "waitlisted" && !reg.hold_expires_at) throw new RegistrationError(409, "no_hold", "No seat is being held for you yet.");
    throw new RegistrationError(410, "hold_expired", "Sorry, the held seat expired and went to the next person.");
  }
  await audit(db, userId, "waitlist_confirm", regId, { event_id: reg.event_id }, now);
  return reg;
}

/**
 * The cron job: cancel holds that ran out, then fill every free seat from the queue.
 * Also catches seats freed by other means (e.g. the organizer raised the capacity).
 */
export async function sweepHolds(db: D1Database, now = new Date()): Promise<{ expired: number; promoted: number }> {
  const expired = await db
    .prepare(
      `UPDATE registrations SET status = 'cancelled', cancelled_at = ?1, hold_expires_at = NULL
        WHERE status = 'waitlisted' AND hold_expires_at IS NOT NULL AND hold_expires_at <= ?1
        RETURNING id, event_id, user_id`,
    )
    .bind(iso(now))
    .all<{ id: string; event_id: string; user_id: string }>();
  for (const r of expired.results ?? []) {
    await audit(db, null, "hold_expired", r.id, { event_id: r.event_id, user_id: r.user_id }, now);
  }

  // Every live event with people waiting for a seat that nobody is holding.
  const events = await db
    .prepare(
      `SELECT DISTINCT r.event_id AS id FROM registrations r JOIN events e ON e.id = r.event_id
        WHERE r.status = 'waitlisted' AND r.hold_expires_at IS NULL AND e.status = 'published' AND e.ends_at > ?`,
    )
    .bind(iso(now))
    .all<{ id: string }>();
  let promoted = 0;
  for (const e of events.results ?? []) promoted += (await promoteWaitlist(db, e.id, now)).length;
  return { expired: expired.results?.length ?? 0, promoted };
}
