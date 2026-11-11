/**
 * Owner panel: the secret-code check and the numbers shown inside.
 * Takes the D1 database as an argument (no "server-only") so tests can use it directly.
 *
 * Owners sign in separately from students: the owner email on the login page, then the secret code.
 */
import { newId } from "@/lib/tokens";
import { csvCell } from "@/lib/data/organizer-actions";
import { enqueueSchedule, onCancelled } from "@/lib/whatsapp";

export const ADMIN_EMAIL = "evntcult@gmail.com";
export const MAX_MISSES = 5;
const MISS_WINDOW_MS = 15 * 60_000;

export class AdminError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

async function sha(v: string) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(v));
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Same time whatever the input, because both sides are hashed to the same length first. */
async function sameText(a: string, b: string) {
  const [x, y] = await Promise.all([sha(a), sha(b)]);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x.charCodeAt(i) ^ y.charCodeAt(i);
  return diff === 0;
}

/** Step 1. Throws unless the email and secret code are right. Wrong tries are limited per IP. */
export async function checkAdminGate(db: D1Database, opts: { email: string; code: string; expected: string | undefined; ip: string | null; now?: Date }) {
  const now = opts.now ?? new Date();
  if (!opts.expected) throw new AdminError(503, "admin_off", "The owner panel isn't set up yet.");
  const ip = opts.ip ?? "unknown";
  const row = await db.prepare("SELECT COUNT(*) AS n FROM admin_misses WHERE ip = ? AND at > ?").bind(ip, new Date(now.getTime() - MISS_WINDOW_MS).toISOString()).first<{ n: number }>();
  if ((row?.n ?? 0) >= MAX_MISSES) throw new AdminError(429, "rate_limited", "Too many wrong tries. Wait 15 minutes.");

  const emailOk = await sameText(opts.email.trim().toLowerCase(), ADMIN_EMAIL);
  const codeOk = await sameText(opts.code, opts.expected);
  if (emailOk && codeOk) return;

  await db.batch([
    db.prepare("INSERT INTO admin_misses (ip, at) VALUES (?, ?)").bind(ip, now.toISOString()),
    db.prepare("DELETE FROM admin_misses WHERE at < ?").bind(new Date(now.getTime() - 86_400_000).toISOString()),
  ]);
  throw new AdminError(401, "wrong_details", "Wrong email or secret code.");
}

export interface AdminOverview {
  stats: { users: number; newUsers: number; published: number; drafts: number; registrations: number; checkins: number; collected: number; toVerify: number };
  events: { id: string; slug: string; title: string; status: string; starts_at: string; organizer: string | null; registered: number; collected: number }[];
  users: { id: string; name: string; email: string; role: string; created_at: string; blocked_at: string | null }[];
  activity: { id: string; action: string; created_at: string; actor: string | null }[];
  stuck: { id: string; student: string; event: string; organizer: string | null; utr: string; claimed_at: string; amount: number }[];
  organizers: { email: string; events: number; passes: number; collected: number }[];
  signups: { day: string; n: number }[];
  outbox: { queued: number; failed: number };
}

export async function adminOverview(db: D1Database, q?: string | null, now = new Date()): Promise<AdminOverview> {
  const search = q?.trim();
  const like = search ? `%${search.replace(/[\\%_]/g, (m) => `\\${m}`)}%` : null;
  const [stats, events, users, activity, stuck, organizers, signups, outbox] = await Promise.all([
    db
      .prepare(
        `SELECT (SELECT COUNT(*) FROM users) AS users,
                (SELECT COUNT(*) FROM users WHERE created_at > ?1) AS newUsers,
                (SELECT COUNT(*) FROM events WHERE status = 'published') AS published,
                (SELECT COUNT(*) FROM events WHERE status = 'draft') AS drafts,
                (SELECT COUNT(*) FROM registrations WHERE status = 'registered') AS registrations,
                (SELECT COUNT(*) FROM checkins WHERE undone_at IS NULL) AS checkins,
                (SELECT COALESCE(SUM(e.price_paise), 0) FROM registrations r JOIN events e ON e.id = r.event_id WHERE r.status = 'registered' AND r.payment_status = 'paid') AS collected,
                (SELECT COALESCE(SUM(e.price_paise), 0) FROM registrations r JOIN events e ON e.id = r.event_id WHERE r.status = 'registered' AND r.payment_status = 'unpaid' AND r.upi_utr IS NOT NULL) AS toVerify`,
      )
      .bind(new Date(now.getTime() - 7 * 86_400_000).toISOString())
      .first<AdminOverview["stats"]>(),
    db
      .prepare(
        `SELECT e.id, e.slug, e.title, e.status, e.starts_at, u.email AS organizer,
                (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id AND r.status = 'registered') AS registered,
                e.price_paise * (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id AND r.status = 'registered' AND r.payment_status = 'paid') AS collected
           FROM events e LEFT JOIN users u ON u.id = e.organizer_id
          ORDER BY e.starts_at DESC LIMIT 100`,
      )
      .all<AdminOverview["events"][number]>(),
    db
      .prepare(`SELECT id, name, email, role, created_at, blocked_at FROM users ${like ? "WHERE name LIKE ?1 ESCAPE '\\' OR email LIKE ?1 ESCAPE '\\'" : ""} ORDER BY created_at DESC LIMIT 100`)
      .bind(...(like ? [like] : []))
      .all<AdminOverview["users"][number]>(),
    db
      .prepare("SELECT a.id, a.action, a.created_at, u.email AS actor FROM audit_log a LEFT JOIN users u ON u.id = a.actor_id ORDER BY a.created_at DESC LIMIT 40")
      .all<AdminOverview["activity"][number]>(),
    // Claimed over a day ago and still not confirmed: a student who paid may be waiting on a slow organizer.
    db
      .prepare(
        `SELECT r.id, s.email AS student, e.title AS event, o.email AS organizer, r.upi_utr AS utr, r.upi_claimed_at AS claimed_at, e.price_paise AS amount
           FROM registrations r JOIN events e ON e.id = r.event_id JOIN users s ON s.id = r.user_id LEFT JOIN users o ON o.id = e.organizer_id
          WHERE r.status = 'registered' AND r.payment_status = 'unpaid' AND r.upi_utr IS NOT NULL AND r.upi_claimed_at < ?
          ORDER BY r.upi_claimed_at LIMIT 50`,
      )
      .bind(new Date(now.getTime() - 86_400_000).toISOString())
      .all<AdminOverview["stuck"][number]>(),
    db
      .prepare(
        `SELECT u.email, COUNT(DISTINCT e.id) AS events,
                COUNT(r.id) AS passes,
                COALESCE(SUM(CASE WHEN r.payment_status = 'paid' THEN e.price_paise END), 0) AS collected
           FROM events e JOIN users u ON u.id = e.organizer_id
           LEFT JOIN registrations r ON r.event_id = e.id AND r.status = 'registered'
          GROUP BY u.id ORDER BY passes DESC LIMIT 10`,
      )
      .all<AdminOverview["organizers"][number]>(),
    db
      .prepare("SELECT substr(created_at, 1, 10) AS day, COUNT(*) AS n FROM users WHERE created_at > ? GROUP BY day")
      .bind(new Date(now.getTime() - 14 * 86_400_000).toISOString())
      .all<{ day: string; n: number }>(),
    db.prepare("SELECT COALESCE(SUM(status = 'queued'), 0) AS queued, COALESCE(SUM(status = 'failed'), 0) AS failed FROM notifications").first<AdminOverview["outbox"]>(),
  ]);
  const byDay = new Map((signups.results ?? []).map((r) => [r.day, r.n]));
  const days = Array.from({ length: 14 }, (_, i) => new Date(now.getTime() - (13 - i) * 86_400_000).toISOString().slice(0, 10));
  return {
    stats: stats!,
    events: events.results ?? [],
    users: users.results ?? [],
    activity: activity.results ?? [],
    stuck: stuck.results ?? [],
    organizers: organizers.results ?? [],
    signups: days.map((day) => ({ day, n: byDay.get(day) ?? 0 })),
    outbox: outbox ?? { queued: 0, failed: 0 },
  };
}

export type OwnerActionKind = "block" | "unblock" | "take_down" | "restore";

/** Each action only applies from the right starting state, so a double-click can't do it twice. */
export async function ownerAction(db: D1Database, kind: OwnerActionKind, id: string, now = new Date()) {
  const at = now.toISOString();
  const statements: Record<OwnerActionKind, D1PreparedStatement> = {
    block: db.prepare("UPDATE users SET blocked_at = ?1 WHERE id = ?2 AND blocked_at IS NULL").bind(at, id),
    unblock: db.prepare("UPDATE users SET blocked_at = NULL WHERE id = ?1 AND blocked_at IS NOT NULL").bind(id),
    take_down: db.prepare("UPDATE events SET status = 'cancelled', updated_at = ?1, version = version + 1 WHERE id = ?2 AND status = 'published'").bind(at, id),
    restore: db.prepare("UPDATE events SET status = 'published', updated_at = ?1, version = version + 1 WHERE id = ?2 AND status = 'cancelled'").bind(at, id),
  };
  const res = await statements[kind].run();
  if ((res.meta.changes ?? 0) === 0) throw new AdminError(409, "no_change", "That was already done, or it no longer exists.");
  if (kind === "take_down") {
    const ev = await db.prepare("SELECT starts_at FROM events WHERE id = ?").bind(id).first<{ starts_at: string }>();
    if (ev) await onCancelled(db, id, ev.starts_at, now);
  } else if (kind === "restore") await enqueueSchedule(db, id, now);
  await db.prepare("INSERT INTO audit_log (id, actor_id, action, target_id, meta, created_at) VALUES (?, NULL, ?, ?, ?, ?)").bind(newId(), `owner_${kind}`, id, JSON.stringify({ by: "owner" }), at).run();
}

export async function adminExport(db: D1Database, type: "users" | "events"): Promise<string> {
  const row = (cells: (string | number | null)[]) => cells.map(csvCell).join(",");
  if (type === "users") {
    const r = await db.prepare("SELECT name, email, role, created_at, blocked_at FROM users ORDER BY created_at DESC").all<{ name: string; email: string; role: string; created_at: string; blocked_at: string | null }>();
    return "\uFEFF" + [row(["Name", "Email", "Role", "Joined (UTC)", "Blocked (UTC)"]), ...(r.results ?? []).map((u) => row([u.name, u.email, u.role, u.created_at, u.blocked_at]))].join("\r\n") + "\r\n";
  }
  const r = await db
    .prepare(
      `SELECT e.title, e.status, e.starts_at, u.email AS organizer, e.price_paise,
              (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id AND r.status = 'registered') AS passes,
              (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id AND r.status = 'registered' AND r.payment_status = 'paid') AS paid
         FROM events e LEFT JOIN users u ON u.id = e.organizer_id ORDER BY e.starts_at DESC`,
    )
    .all<{ title: string; status: string; starts_at: string; organizer: string | null; price_paise: number; passes: number; paid: number }>();
  return "\uFEFF" + [row(["Event", "Status", "Starts (UTC)", "Organizer", "Price (Rs)", "Passes", "Paid", "Collected (Rs)"]), ...(r.results ?? []).map((e) => row([e.title, e.status, e.starts_at, e.organizer, e.price_paise / 100, e.passes, e.paid, (e.price_paise * e.paid) / 100]))].join("\r\n") + "\r\n";
}
