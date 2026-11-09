/**
 * The notification bell. It reads the same rows as WhatsApp, so everyone sees every message
 * on the site, even without WhatsApp. Wording is built from the current event each time.
 */
import { fmtDateTime } from "@/lib/whatsapp";

export interface InboxItem {
  id: string;
  text: string;
  href: string;
  at: string;
  read: boolean;
}

/* Skipped only because WhatsApp couldn't be used: the person should still see it here. */
const VISIBLE = `(n.status IN ('sent','dry_run','failed') OR (n.status = 'skipped' AND n.error IN ('not_opted_in','no_phone','opted_out','cap')))
                 AND json_extract(n.payload, '$.test') IS NULL`;

type Row = {
  id: string;
  template: string;
  payload: string;
  scheduled_for: string;
  read_at: string | null;
  title: string;
  slug: string;
  starts_at: string;
  venue: string | null;
  venue_status: string;
  cert_id: string | null;
};

function describe(r: Row): string {
  const when = fmtDateTime(r.starts_at);
  const place = r.venue_status === "tba" || !r.venue ? "venue TBA" : r.venue;
  switch (r.template) {
    case "pass_confirmed":
      return `Your pass for ${r.title} is confirmed.`;
    case "event_reminder":
      return `${r.title} is on ${when} at ${place}.`;
    case "event_soon":
      return `${r.title} starts soon, at ${when}.`;
    case "event_updated":
      return `${r.title} changed: now ${when}, ${place}.`;
    case "event_cancelled":
      return `${r.title} has been cancelled.`;
    case "payment_pending":
      return `Your payment for ${r.title} is pending.`;
    case "waitlist_offer":
      return `A seat opened up for ${r.title}. Confirm it soon.`;
    case "certificate_ready":
      return `Your certificate for ${r.title} is ready.`;
    case "checked_in":
      return `You're checked in at ${r.title}.`;
    case "event_update": {
      const message = (JSON.parse(r.payload || "{}") as { message?: string }).message;
      return message ? `${r.title}: ${message}` : `Update for ${r.title}.`;
    }
    default:
      return r.title;
  }
}

export async function inbox(db: D1Database, userId: string, now = new Date()): Promise<{ items: InboxItem[]; unread: number }> {
  const rows = await db
    .prepare(
      `SELECT n.id, n.template, n.payload, n.scheduled_for, n.read_at, e.title, e.slug, e.starts_at, e.venue, e.venue_status,
              (SELECT ct.id FROM certificates ct JOIN registrations r ON r.id = ct.registration_id WHERE r.user_id = n.user_id AND ct.event_id = e.id AND ct.revoked_at IS NULL LIMIT 1) AS cert_id
         FROM notifications n JOIN events e ON e.id = n.event_id
        WHERE n.user_id = ? AND n.scheduled_for <= ? AND ${VISIBLE}
        ORDER BY n.scheduled_for DESC LIMIT 30`,
    )
    .bind(userId, now.toISOString())
    .all<Row>();
  const items = (rows.results ?? []).map((r) => ({
    id: r.id,
    text: describe(r),
    href: r.template === "certificate_ready" && r.cert_id ? `/certificates/${r.cert_id}` : `/events/${r.slug}`,
    at: r.scheduled_for,
    read: !!r.read_at,
  }));
  return { items, unread: items.filter((i) => !i.read).length };
}

export async function markAllRead(db: D1Database, userId: string, now = new Date()) {
  await db.prepare("UPDATE notifications SET read_at = ? WHERE user_id = ? AND read_at IS NULL AND scheduled_for <= ?").bind(now.toISOString(), userId, now.toISOString()).run();
}
