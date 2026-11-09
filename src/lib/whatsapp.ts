/**
 * The WhatsApp pipeline: what to send, when, and the one function that talks to Meta.
 *
 * Without WA_TOKEN nothing leaves: each message is marked 'dry_run' and everything else
 * (schedule, dedupe, cap, panel) behaves the same. Going live is setting the secrets.
 *
 * Message contents are worked out at send time from the current event, so a reminder
 * queued weeks ago can never announce an old venue. Takes the D1 database as an argument.
 */
import { newId } from "@/lib/tokens";

export interface WaEnv {
  WA_TOKEN?: string;
  WA_PHONE_NUMBER_ID?: string;
}

export const MAX_PER_EVENT = 5;
const SITE = process.env.SITE_URL ?? "https://evntcult.caliper.workers.dev";
const HOUR = 3_600_000;
const SCHEDULED = ["event_reminder", "event_soon", "payment_pending"];

const ist = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", ...o });
const fmtDate = (iso: string) => ist({ weekday: "short", day: "numeric", month: "short" }).format(new Date(iso));
const fmtTime = (iso: string) => ist({ hour: "numeric", minute: "2-digit", hour12: true }).format(new Date(iso));
const fmtDateTime = (iso: string) => `${fmtDate(iso)}, ${fmtTime(iso)}`;
const gateTime = (iso: string) => fmtTime(new Date(Date.parse(iso) - 30 * 60_000).toISOString());
const rupees = (paise: number) => `Rs ${(paise / 100).toFixed(paise % 100 ? 2 : 0)}`;

interface Ctx {
  title: string;
  starts_at: string;
  venue: string | null;
  price_paise: number;
  pass_code: string;
  holdExpiry: string;
  changeSummary: string;
  certificateUrl: string;
  message: string;
}

/** Each template's variables, in the order they are approved with Meta. */
export const TEMPLATES: Record<string, (e: Ctx) => string[]> = {
  pass_confirmed: (e) => [e.title, fmtDateTime(e.starts_at), e.pass_code],
  event_reminder: (e) => [e.title, fmtTime(e.starts_at), e.venue ?? "venue TBA", e.pass_code],
  event_soon: (e) => [e.title, fmtTime(e.starts_at), gateTime(e.starts_at), e.pass_code],
  event_updated: (e) => [e.title, e.changeSummary],
  event_cancelled: (e) => [e.title, fmtDate(e.starts_at)],
  payment_pending: (e) => [e.title, rupees(e.price_paise), fmtDate(e.starts_at)],
  waitlist_offer: (e) => [e.title, e.holdExpiry],
  certificate_ready: (e) => [e.title],
  checked_in: (e) => [e.venue ?? e.title, e.certificateUrl],
  event_update: (e) => [e.title, e.message],
};

const isExempt = (t: string) => t === "event_cancelled" || t === "waitlist_offer";
const cleanParam = (v: string) => v.replace(/[\r\n\t]+/g, " ").replace(/ {4,}/g, "   ").trim().slice(0, 500);

/* ─── Queueing ──────────────────────────────────────────────────────── */

function insertFor(db: D1Database, eventId: string, template: string, keyPart: string, due: string, filter: string, now: Date) {
  return db
    .prepare(
      `INSERT INTO notifications (id, user_id, event_id, channel, template, payload, status, created_at, scheduled_for, dedupe_key)
       SELECT lower(hex(randomblob(16))), r.user_id, r.event_id, 'whatsapp', ?1, '{}', 'queued', ?2, ?3, ?1 || ':' || r.event_id || ':' || ?4 || ':' || r.user_id
         FROM registrations r JOIN events e ON e.id = r.event_id
        WHERE r.event_id = ?5 AND r.status = 'registered' ${filter}
       ON CONFLICT (dedupe_key) DO NOTHING`,
    )
    .bind(template, now.toISOString(), due, keyPart, eventId);
}

const HAS_PAID = "AND (e.price_paise = 0 OR r.payment_status = 'paid')";
const OWES = "AND e.price_paise > 0 AND r.payment_status = 'unpaid'";

/**
 * Reminders for a published event. Safe to run again and again: the key includes the start
 * time, so moving an event starts fresh and repeating changes nothing. The cron runs this
 * too, because most people register after an event is published.
 */
export async function enqueueSchedule(db: D1Database, eventId: string, now = new Date()) {
  const ev = await db.prepare("SELECT starts_at, status FROM events WHERE id = ?").bind(eventId).first<{ starts_at: string; status: string }>();
  if (!ev || ev.status !== "published") return;
  const start = Date.parse(ev.starts_at);
  if (start <= now.getTime()) return;
  const dayBefore = new Date(start - 24 * HOUR).toISOString();
  const statements = [
    insertFor(db, eventId, "event_soon", ev.starts_at, new Date(start - 2 * HOUR).toISOString(), HAS_PAID, now),
    insertFor(db, eventId, "payment_pending", ev.starts_at, dayBefore, OWES, now),
  ];
  // Someone registering in the last two hours gets the "soon" message only, not both at once.
  if (now.getTime() < start - 2 * HOUR) statements.push(insertFor(db, eventId, "event_reminder", ev.starts_at, dayBefore, HAS_PAID, now));
  await db.batch(statements);
}

export async function enqueueUpcoming(db: D1Database, now = new Date()) {
  const rows = await db.prepare("SELECT id FROM events WHERE status = 'published' AND starts_at > ?").bind(now.toISOString()).all<{ id: string }>();
  for (const e of rows.results ?? []) await enqueueSchedule(db, e.id, now);
}

/** One message for one person. The key makes repeats harmless. */
export async function enqueueOne(db: D1Database, userId: string, eventId: string, template: string, key: string, now = new Date(), payload = "{}") {
  await db
    .prepare(
      `INSERT INTO notifications (id, user_id, event_id, channel, template, payload, status, created_at, scheduled_for, dedupe_key)
       VALUES (?, ?, ?, 'whatsapp', ?, ?, 'queued', ?, ?, ?) ON CONFLICT (dedupe_key) DO NOTHING`,
    )
    .bind(newId(), userId, eventId, template, payload, now.toISOString(), now.toISOString(), `${key}:${userId}`)
    .run();
}

export async function enqueueCheckedIn(db: D1Database, registrationId: string, now = new Date()) {
  const r = await db.prepare("SELECT user_id, event_id FROM registrations WHERE id = ?").bind(registrationId).first<{ user_id: string; event_id: string }>();
  if (r) await enqueueOne(db, r.user_id, r.event_id, "checked_in", `checked_in:${registrationId}`, now);
}

/** After the organizer's bulk issue: one message each, never repeated. */
export async function enqueueCertificateReady(db: D1Database, eventId: string, now = new Date()) {
  await db
    .prepare(
      `INSERT INTO notifications (id, user_id, event_id, channel, template, payload, status, created_at, scheduled_for, dedupe_key)
       SELECT lower(hex(randomblob(16))), r.user_id, ct.event_id, 'whatsapp', 'certificate_ready', '{}', 'queued', ?2, ?2, 'certificate_ready:' || ct.registration_id || ':' || r.user_id
         FROM certificates ct JOIN registrations r ON r.id = ct.registration_id
        WHERE ct.event_id = ?1 AND ct.kind = 'participation' AND ct.revoked_at IS NULL
       ON CONFLICT (dedupe_key) DO NOTHING`,
    )
    .bind(eventId, now.toISOString())
    .run();
}

/**
 * The event's time or venue changed. Old reminders go, new ones are built, and everyone gets
 * one "updated" message 5 minutes after the last edit, so six quick edits send one message.
 */
export async function onMaterialChange(db: D1Database, eventId: string, startsAt: string, now = new Date()) {
  const soon = Date.parse(startsAt) - now.getTime() < 2 * HOUR;
  const due = new Date(now.getTime() + (soon ? 0 : 5 * 60_000)).toISOString();
  await db.batch([
    db.prepare(`DELETE FROM notifications WHERE event_id = ?1 AND status = 'queued' AND template IN ('event_reminder','event_soon','payment_pending','event_updated')`).bind(eventId),
    insertFor(db, eventId, "event_updated", String(now.getTime()), due, "", now),
  ]);
  await enqueueSchedule(db, eventId, now);
}

/** Everyone holding a seat hears about it, and pending reminders are dropped. */
export async function onCancelled(db: D1Database, eventId: string, startsAt: string, now = new Date()) {
  await db.batch([
    db.prepare(`DELETE FROM notifications WHERE event_id = ? AND status = 'queued' AND template IN (${SCHEDULED.map((t) => `'${t}'`).join(",")},'event_updated')`).bind(eventId),
    insertFor(db, eventId, "event_cancelled", startsAt, now.toISOString(), "", now),
  ]);
}

/* ─── Sending ───────────────────────────────────────────────────────── */

/** The only function that calls Meta. */
export async function sendTemplate(env: WaEnv, to: string, name: string, params: string[]): Promise<{ dry: boolean; id?: string; error?: string }> {
  if (!env.WA_TOKEN || !env.WA_PHONE_NUMBER_ID) return { dry: true };
  const res = await fetch(`https://graph.facebook.com/v21.0/${env.WA_PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.WA_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: to.replace(/^\+/, ""),
      type: "template",
      template: { name, language: { code: "en" }, components: [{ type: "body", parameters: params.map((text) => ({ type: "text", text })) }] },
    }),
  });
  const body = (await res.json().catch(() => ({}))) as { messages?: { id: string }[]; error?: { code?: number; message?: string } };
  if (!res.ok) return { dry: false, error: `${res.status} ${body.error?.code ?? ""} ${body.error?.message ?? ""}`.slice(0, 300) };
  return { dry: false, id: body.messages?.[0]?.id };
}

interface Due {
  id: string;
  user_id: string;
  event_id: string;
  template: string;
  payload: string;
  attempts: number;
  phone: string | null;
  whatsapp_opt_in: number;
  wa_opt_out_at: string | null;
}

/** 08:15 IST, the next time that comes round. */
export function nextMorning(now: Date): Date {
  const day = ist({ year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const get = (t: string) => day.find((p) => p.type === t)!.value;
  const today = new Date(`${get("year")}-${get("month")}-${get("day")}T08:15:00+05:30`);
  return today.getTime() > now.getTime() ? today : new Date(today.getTime() + 24 * HOUR);
}

export function inQuietHours(now: Date): boolean {
  const hour = Number(ist({ hour: "2-digit", hourCycle: "h23" }).format(now));
  return hour >= 23 || hour < 8;
}

/** Works out the message from current data, or says why it should no longer go. */
async function buildParams(db: D1Database, n: Due, now: Date): Promise<{ params: string[] } | { skip: string }> {
  const e = await db
    .prepare(
      `SELECT e.title, e.slug, e.starts_at, e.venue, e.venue_status, e.price_paise, e.status, r.pass_code, r.status AS reg_status, r.payment_status, r.hold_expires_at,
              (SELECT ct.id FROM certificates ct WHERE ct.registration_id = r.id AND ct.revoked_at IS NULL LIMIT 1) AS cert_id
         FROM events e LEFT JOIN registrations r ON r.event_id = e.id AND r.user_id = ?
        WHERE e.id = ?`,
    )
    .bind(n.user_id, n.event_id)
    .first<{ title: string; slug: string; starts_at: string; venue: string | null; venue_status: string; price_paise: number; status: string; pass_code: string | null; reg_status: string | null; payment_status: string | null; hold_expires_at: string | null; cert_id: string | null }>();
  if (!e) return { skip: "event_gone" };
  const payload = JSON.parse(n.payload || "{}") as { test?: boolean; message?: string };
  const started = Date.parse(e.starts_at) <= now.getTime();

  if (!payload.test) {
    if (n.template === "waitlist_offer") {
      if (e.reg_status !== "waitlisted" || !e.hold_expires_at || Date.parse(e.hold_expires_at) <= now.getTime()) return { skip: "hold_over" };
    } else if (e.reg_status !== "registered") return { skip: "not_registered" };
    if (SCHEDULED.includes(n.template) || n.template === "event_updated") {
      if (e.status !== "published") return { skip: "event_not_live" };
      if (started) return { skip: "too_late" };
    }
    if (n.template === "event_cancelled" && e.status !== "cancelled") return { skip: "event_not_cancelled" };
    if (n.template === "payment_pending" && e.payment_status === "paid") return { skip: "already_paid" };
  }

  const venue = e.venue_status === "tba" ? null : e.venue;
  const params = TEMPLATES[n.template]?.({
    title: e.title,
    starts_at: e.starts_at,
    venue,
    price_paise: e.price_paise,
    pass_code: payload.test ? "TEST" : (e.pass_code ?? ""),
    holdExpiry: e.hold_expires_at ? fmtDateTime(e.hold_expires_at) : "",
    changeSummary: `now ${fmtDateTime(e.starts_at)}, ${venue ? `at ${venue}` : "venue TBA"}`,
    certificateUrl: e.cert_id ? `${SITE}/certificates/${e.cert_id}` : `${SITE}/passes`,
    message: payload.message ?? "",
  });
  return params ? { params: params.map(cleanParam) } : { skip: "unknown_template" };
}

async function mark(db: D1Database, id: string, status: string, error: string | null, now: Date, providerId?: string) {
  await db.prepare("UPDATE notifications SET status = ?, error = ?, provider_id = ?, sent_at = CASE WHEN ? IN ('sent','dry_run') THEN ? ELSE sent_at END WHERE id = ?").bind(status, error, providerId ?? null, status, now.toISOString(), id).run();
}

/** Runs every minute. Taking a row first means two overlapping runs can never send it twice. */
export async function flush(db: D1Database, env: WaEnv, now = new Date()): Promise<{ sent: number; dry: number; skipped: number; failed: number }> {
  const totals = { sent: 0, dry: 0, skipped: 0, failed: 0 };
  const due = await db
    .prepare(
      `SELECT n.id, n.user_id, n.event_id, n.template, n.payload, n.attempts, u.phone, u.whatsapp_opt_in, u.wa_opt_out_at
         FROM notifications n JOIN users u ON u.id = n.user_id
        WHERE n.status = 'queued' AND n.scheduled_for <= ? ORDER BY n.scheduled_for LIMIT 50`,
    )
    .bind(now.toISOString())
    .all<Due>();

  for (const n of due.results ?? []) {
    if (!n.whatsapp_opt_in || n.wa_opt_out_at || !n.phone) {
      await mark(db, n.id, "skipped", n.wa_opt_out_at ? "opted_out" : !n.phone ? "no_phone" : "not_opted_in", now);
      totals.skipped++;
      continue;
    }
    const count = await db.prepare("SELECT COUNT(*) AS n FROM notifications WHERE user_id = ? AND event_id = ? AND status IN ('sent','dry_run')").bind(n.user_id, n.event_id).first<{ n: number }>();
    if ((count?.n ?? 0) >= MAX_PER_EVENT && !isExempt(n.template)) {
      await mark(db, n.id, "skipped", "cap", now);
      totals.skipped++;
      continue;
    }
    if (inQuietHours(now) && n.template !== "event_cancelled") {
      await db.prepare("UPDATE notifications SET scheduled_for = ? WHERE id = ?").bind(nextMorning(now).toISOString(), n.id).run();
      continue;
    }

    const built = await buildParams(db, n, now);
    if ("skip" in built) {
      await mark(db, n.id, "skipped", built.skip, now);
      totals.skipped++;
      continue;
    }

    const took = await db.prepare("UPDATE notifications SET status = 'sending', attempts = attempts + 1 WHERE id = ? AND status = 'queued'").bind(n.id).run();
    if ((took.meta.changes ?? 0) !== 1) continue;

    let res: { dry: boolean; id?: string; error?: string };
    try {
      res = await sendTemplate(env, n.phone, n.template, built.params);
    } catch {
      res = { dry: false, error: "network_error" };
    }
    if (res.error) {
      if (n.attempts + 1 < 3) {
        await db.prepare("UPDATE notifications SET status = 'queued', error = ?, scheduled_for = ? WHERE id = ?").bind(res.error, new Date(now.getTime() + 15 * 60_000).toISOString(), n.id).run();
      } else {
        await mark(db, n.id, "failed", res.error, now);
        totals.failed++;
      }
    } else if (res.dry) {
      await mark(db, n.id, "dry_run", null, now);
      totals.dry++;
    } else {
      await mark(db, n.id, "sent", null, now, res.id);
      totals.sent++;
    }
  }
  return totals;
}

/* ─── Opt in and out ────────────────────────────────────────────────── */

const fromWhatsApp = (from: string) => `+${from.replace(/\D/g, "")}`;

/** WhatsApp sends numbers as 919876543210; we store +919876543210. */
export async function setOptFromWhatsApp(db: D1Database, from: string, optIn: boolean, now = new Date()) {
  await db
    .prepare(optIn ? "UPDATE users SET whatsapp_opt_in = 1, wa_opt_in_at = ?, wa_opt_out_at = NULL WHERE phone = ?" : "UPDATE users SET whatsapp_opt_in = 0, wa_opt_out_at = ? WHERE phone = ?")
    .bind(now.toISOString(), fromWhatsApp(from))
    .run();
}

/* ─── Organizer panel ───────────────────────────────────────────────── */

export interface WaPanel {
  optedIn: number;
  queued: number;
  sent: number;
  dryRun: number;
  failed: number;
  mostSentToOne: number;
  next: { at: string; template: string; count: number }[];
}

/** Counts and the next five sends. Never message contents. */
export async function waPanel(db: D1Database, eventId: string, now = new Date()): Promise<WaPanel> {
  const [counts, next, opted, top] = await Promise.all([
    db.prepare("SELECT COALESCE(SUM(status='queued'),0) AS queued, COALESCE(SUM(status='sent'),0) AS sent, COALESCE(SUM(status='dry_run'),0) AS dry_run, COALESCE(SUM(status='failed'),0) AS failed FROM notifications WHERE event_id = ?").bind(eventId).first<{ queued: number; sent: number; dry_run: number; failed: number }>(),
    db.prepare("SELECT scheduled_for AS at, template, COUNT(*) AS count FROM notifications WHERE event_id = ? AND status = 'queued' AND scheduled_for >= ? GROUP BY scheduled_for, template ORDER BY scheduled_for LIMIT 5").bind(eventId, now.toISOString()).all<{ at: string; template: string; count: number }>(),
    db.prepare("SELECT COUNT(*) AS n FROM registrations r JOIN users u ON u.id = r.user_id WHERE r.event_id = ? AND r.status = 'registered' AND u.whatsapp_opt_in = 1 AND u.phone IS NOT NULL").bind(eventId).first<{ n: number }>(),
    db.prepare("SELECT COUNT(*) AS n FROM notifications WHERE event_id = ? AND status IN ('sent','dry_run') GROUP BY user_id ORDER BY n DESC LIMIT 1").bind(eventId).first<{ n: number }>(),
  ]);
  return { optedIn: opted?.n ?? 0, queued: counts?.queued ?? 0, sent: counts?.sent ?? 0, dryRun: counts?.dry_run ?? 0, failed: counts?.failed ?? 0, mostSentToOne: top?.n ?? 0, next: next.results ?? [] };
}

/** Sends the organizer a sample, so they can see it arrive. */
export async function queueTest(db: D1Database, userId: string, eventId: string, now = new Date()) {
  await enqueueOne(db, userId, eventId, "pass_confirmed", `test:${eventId}:${now.getTime()}`, now, JSON.stringify({ test: true }));
}

/** After going live: send recent dry-run messages for real. */
export async function replayDryRun(db: D1Database, since: string) {
  const res = await db.prepare("UPDATE notifications SET status = 'queued', sent_at = NULL WHERE status = 'dry_run' AND created_at >= ?").bind(since).run();
  return res.meta.changes ?? 0;
}
