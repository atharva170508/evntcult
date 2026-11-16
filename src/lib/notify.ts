/**
 * notify(): every WhatsApp message goes through here into the `notifications` outbox.
 *
 *  • Only students who ticked the WhatsApp consent box (users.whatsapp_opt_in = 1) and have
 *    a number are queued. Event updates and reminders go to the event's REGISTERED students only.
 *  • Messages must use pre-approved WhatsApp templates, so we store a template name plus its
 *    variables (payload) — never free text, and never a phone number.
 *  • Each message has a dedupe_key, so the cron and retries can't queue it twice.
 *  • Nothing is sent yet: no provider is connected (WHATSAPP_PROVIDER is unset). The queue
 *    fills, and the organizer screens say "WhatsApp sending: not connected" with the count.
 *
 * Takes the D1 database as an argument (no "server-only"), so the cron in worker.ts can use it.
 */
import { newId } from "@/lib/tokens";

/** The templates that will be submitted to Meta for approval. Variables are filled in order. */
export const TEMPLATES = {
  /** "Update for {{1}}: {{2}}" */
  event_update: { variables: ["event_title", "message"] },
  /** "A seat opened up for {{1}}! Confirm by {{2}}: {{3}}" */
  seat_hold: { variables: ["event_title", "confirm_by", "link"] },
  /** "Reminder: {{1}} starts {{2}} at {{3}}. Your pass: {{4}}" */
  event_reminder: { variables: ["event_title", "starts", "venue", "pass_code"] },
} as const;

export type TemplateName = keyof typeof TEMPLATES;
export type Payload<T extends TemplateName> = Record<(typeof TEMPLATES)[T]["variables"][number], string>;

/** Is a WhatsApp provider connected? Not yet — see M4 notes in the README. */
export function whatsappConnected(env: { WHATSAPP_PROVIDER?: string } = process.env as { WHATSAPP_PROVIDER?: string }): boolean {
  return !!env.WHATSAPP_PROVIDER;
}

/** Template variables are short single lines (WhatsApp rejects newlines/tabs and very long values). */
function clean(payload: Record<string, string>): string {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(payload)) out[k] = String(v).replace(/[\r\n\t]+/g, " ").replace(/ {4,}/g, "   ").trim().slice(0, 500);
  return JSON.stringify(out);
}

const REGISTERED_OPTED_IN = `
  FROM registrations r JOIN users u ON u.id = r.user_id
 WHERE r.event_id = ? AND r.status = 'registered' AND u.whatsapp_opt_in = 1 AND u.phone IS NOT NULL`;

/** Queue one message per opted-in registered student of an event. Returns how many were queued. */
export async function notifyRegistered<T extends TemplateName>(
  db: D1Database,
  eventId: string,
  template: T,
  payload: Payload<T>,
  dedupePrefix: string,
  now = new Date(),
): Promise<number> {
  const res = await db
    .prepare(
      `INSERT INTO notifications (id, user_id, event_id, channel, template, payload, status, created_at, dedupe_key)
       SELECT lower(hex(randomblob(16))), u.id, r.event_id, 'whatsapp', ?, ?, 'queued', ?, ? || ':' || u.id
       ${REGISTERED_OPTED_IN}
       ON CONFLICT (dedupe_key) DO NOTHING`,
    )
    .bind(template, clean(payload), now.toISOString(), dedupePrefix, eventId)
    .run();
  return res.meta.changes ?? 0;
}

/** Queue one message to one student (if they opted in). Returns true if queued. */
export async function notifyUser<T extends TemplateName>(
  db: D1Database,
  userId: string,
  eventId: string | null,
  template: T,
  payload: Payload<T>,
  dedupeKey: string,
  now = new Date(),
): Promise<boolean> {
  const res = await db
    .prepare(
      `INSERT INTO notifications (id, user_id, event_id, channel, template, payload, status, created_at, dedupe_key)
       SELECT ?, u.id, ?, 'whatsapp', ?, ?, 'queued', ?, ? FROM users u
        WHERE u.id = ? AND u.whatsapp_opt_in = 1 AND u.phone IS NOT NULL
       ON CONFLICT (dedupe_key) DO NOTHING`,
    )
    .bind(newId(), eventId, template, clean(payload), now.toISOString(), dedupeKey, userId)
    .run();
  return (res.meta.changes ?? 0) === 1;
}

/** "Sat 21 Nov, 7:30 pm" in IST, for template variables. */
export function istLabel(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true }).format(new Date(iso));
}

/**
 * Cron: queue the day-before reminder for every published event starting in the next 24 hours.
 * Runs every 5 minutes; dedupe keys make it once per student per event, and students who
 * register later in that window still get one on the next run.
 */
export async function queueDayBeforeReminders(db: D1Database, now = new Date()): Promise<number> {
  const events = await db
    .prepare("SELECT id, title, venue, starts_at FROM events WHERE status = 'published' AND starts_at > ? AND starts_at <= ?")
    .bind(now.toISOString(), new Date(now.getTime() + 24 * 3_600_000).toISOString())
    .all<{ id: string; title: string; venue: string; starts_at: string }>();

  let queued = 0;
  for (const e of events.results ?? []) {
    // pass_code differs per person, so this one is inserted per registration.
    const res = await db
      .prepare(
        `INSERT INTO notifications (id, user_id, event_id, channel, template, payload, status, created_at, dedupe_key)
         SELECT lower(hex(randomblob(16))), u.id, r.event_id, 'whatsapp', 'event_reminder',
                json_object('event_title', ?, 'starts', ?, 'venue', ?, 'pass_code', r.pass_code),
                'queued', ?, 'reminder:' || r.event_id || ':' || u.id
         ${REGISTERED_OPTED_IN}
         ON CONFLICT (dedupe_key) DO NOTHING`,
      )
      .bind(e.title, istLabel(e.starts_at), e.venue, now.toISOString(), e.id)
      .run();
    queued += res.meta.changes ?? 0;
  }
  return queued;
}

/** Outbox numbers for the organizer screens. */
export async function outboxCounts(db: D1Database, eventIds: string[] | null): Promise<{ queued: number; sent: number; failed: number }> {
  const filter = eventIds ? `AND event_id IN (${eventIds.map(() => "?").join(",") || "NULL"})` : "";
  const row = await db
    .prepare(
      `SELECT SUM(status = 'queued') AS queued, SUM(status = 'sent') AS sent, SUM(status = 'failed') AS failed
         FROM notifications WHERE channel = 'whatsapp' ${filter}`,
    )
    .bind(...(eventIds ?? []))
    .first<{ queued: number | null; sent: number | null; failed: number | null }>();
  return { queued: row?.queued ?? 0, sent: row?.sent ?? 0, failed: row?.failed ?? 0 };
}
