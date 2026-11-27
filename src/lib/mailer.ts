/**
 * Event emails: registration confirmation (with auto-updating .ics calendar invite),
 * 24-hour reminders, venue/time updates (with updated .ics SEQUENCE), host announcements,
 * cancellations (with METHOD:CANCEL .ics), and post-event feedback.
 * Queued in the notifications table with channel 'email' and flushed by the cron via Brevo.
 */
import { buildIcs, icsFileName, toBase64Utf8 } from "./ics";
import { button, esc, layout, links, note, P, stars, stub } from "./mail-kit";
import { passName } from "./pass-name";

type MailEnv = { BREVO_API_KEY?: string; EMAIL_FROM?: string; EMAIL_PROVIDER?: string; NEXT_PUBLIC_SITE_URL?: string };
type MailAttachment = { name: string; content: string };

const site = (env: MailEnv) => (env.NEXT_PUBLIC_SITE_URL || "https://evntcult.caliper.workers.dev").replace(/\/$/, "");

const IST = { timeZone: "Asia/Kolkata" } as const;
const when = (startIso: string, endIso: string) => {
  const s = new Date(startIso);
  const e = new Date(endIso);
  const day = s.toLocaleDateString("en-IN", { ...IST, weekday: "long", day: "numeric", month: "long" });
  const t = (d: Date) => d.toLocaleTimeString("en-IN", { ...IST, hour: "numeric", minute: "2-digit" }).toLowerCase();
  return `${day}, ${t(s)} to ${t(e)}`;
};

export async function sendEmail(
  env: MailEnv,
  to: { email: string; name?: string },
  subject: string,
  html: string,
  text: string,
  attachments?: MailAttachment[],
) {
  if (env.EMAIL_PROVIDER === "log" && !env.BREVO_API_KEY) {
    console.log(`[email:log] to ${to.email}: ${subject}`);
    return { dry: true };
  }
  if (!env.BREVO_API_KEY || !env.EMAIL_FROM) return { dry: true };
  const payload: Record<string, unknown> = {
    sender: { name: "EvntCult", email: env.EMAIL_FROM },
    to: [to],
    subject,
    textContent: text,
    htmlContent: html,
  };
  if (attachments?.length) payload.attachment = attachments;
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": env.BREVO_API_KEY, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`brevo ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return { dry: false };
}

type Row = {
  id: string;
  template: string;
  payload: string | null;
  user_id: string;
  event_id: string;
  email: string;
  name: string;
  title: string;
  slug: string;
  starts_at: string;
  ends_at: string;
  venue: string | null;
  venue_address: string | null;
  venue_status: string | null;
  confirm_message: string | null;
  event_version: number | null;
  event_status: string | null;
  host: string | null;
  pass_code: string | null;
  status: string | null;
};

function placeOf(r: Row) {
  if (r.venue_status === "tba") return "Venue to be announced";
  return [r.venue, r.venue_address].filter(Boolean).join(", ") || "Venue to be announced";
}

function inviteAttachment(r: Row, base: string, fromEmail: string | undefined, method: "REQUEST" | "CANCEL"): MailAttachment {
  const ics = buildIcs({
    uid: `event-${r.event_id}@evntcult`,
    title: r.title,
    startsAt: r.starts_at,
    endsAt: r.ends_at,
    location: placeOf(r),
    description: r.pass_code
      ? `Pass: ${passName(r.pass_code).label}\nOpen your pass: ${base}/passes\nEvent page: ${base}/events/${r.slug}`
      : `Event page: ${base}/events/${r.slug}`,
    url: `${base}/events/${r.slug}`,
    method,
    sequence: Math.max(0, r.event_version ?? 0),
    status: method === "CANCEL" ? "CANCELLED" : "CONFIRMED",
    organizerName: r.host || "EvntCult",
    organizerEmail: fromEmail || "events@evntcult.app",
    attendeeName: r.name,
    attendeeEmail: r.email,
  });
  return { name: icsFileName(r.title), content: toBase64Utf8(ics) };
}

export function registeredEmail(r: Row, base: string) {
  const first = r.name.split(/\s+/)[0] || "there";
  const waiting = r.status === "waitlisted";
  const pending = r.status === "pending";
  const heading = waiting ? `You're on the waitlist, ${first}.` : pending ? `Request sent, ${first}.` : `You're in, ${first}.`;
  const page = `${base}/events/${r.slug}`;
  const loc = placeOf(r);
  const body =
    P(
      waiting
        ? `${esc(r.title)} is full right now. If a seat opens, we'll hold it for you and tell you straight away.`
        : pending
          ? `${esc(r.host ?? "The host")} approves each guest for ${esc(r.title)}. You'll get your pass as soon as they say yes.`
          : `Your seat at ${esc(r.title)} is confirmed. We attached a calendar invite so your phone reminds you automatically, and your pass works offline at the gate.`,
    ) +
    stub({
      title: r.title,
      rows: [
        ["When", when(r.starts_at, r.ends_at)],
        ["Where", loc],
        ...(r.host ? ([["Host", r.host]] as [string, string][]) : []),
      ],
      code: !waiting && !pending && r.pass_code ? passName(r.pass_code).label : undefined,
    }) +
    (r.confirm_message ? note(r.host ?? "the host", r.confirm_message) : "") +
    button(waiting || pending ? page : `${base}/passes`, waiting || pending ? "See the event" : "Open your pass") +
    links([
      { href: `${base}/api/events/${r.slug}/ics`, label: "Add to calendar" },
      { href: page, label: "Event page" },
    ]);
  const text = `${heading}\n\n${r.title}\n${when(r.starts_at, r.ends_at)}\n${loc}\n${r.pass_code && !waiting && !pending ? `Pass: ${passName(r.pass_code).label}\n` : ""}${r.confirm_message ? `\nA note from ${r.host ?? "the host"}:\n${r.confirm_message}\n` : ""}\nYour pass: ${base}/passes\nEvent page: ${page}`;
  return {
    subject: waiting ? `Waitlist: ${r.title}` : pending ? `Request sent: ${r.title}` : `You're in: ${r.title}`,
    html: layout({
      title: r.title,
      preheader: waiting ? "We'll tell you if a seat opens." : `${when(r.starts_at, r.ends_at)}. Your pass and calendar invite are inside.`,
      heading,
      body,
      footer: `You're getting this because you registered for ${esc(r.title)} on EvntCult.`,
      siteUrl: base,
    }),
    text,
    attachIcs: !waiting && !pending ? ("REQUEST" as const) : null,
  };
}

export function reminderEmail(r: Row, base: string) {
  const first = r.name.split(/\s+/)[0] || "there";
  const page = `${base}/events/${r.slug}`;
  const loc = placeOf(r);
  const body =
    P(`${esc(r.title)} is coming up soon, ${esc(first)}. Keep your pass handy at the gate; it opens offline too.`) +
    stub({
      title: r.title,
      rows: [
        ["When", when(r.starts_at, r.ends_at)],
        ["Where", loc],
        ...(r.host ? ([["Host", r.host]] as [string, string][]) : []),
      ],
      code: r.pass_code ? passName(r.pass_code).label : undefined,
    }) +
    button(`${base}/passes`, "Open your pass") +
    links([
      { href: page, label: "Event details" },
      { href: `${base}/api/events/${r.slug}/ics`, label: "Add to calendar" },
    ]);
  const text = `Reminder: ${r.title} is coming up.\n\nWhen: ${when(r.starts_at, r.ends_at)}\nWhere: ${loc}\n${r.pass_code ? `Pass: ${passName(r.pass_code).label}\n` : ""}\nOpen your pass: ${base}/passes\nEvent page: ${page}`;
  return {
    subject: `Reminder: ${r.title} is tomorrow`,
    html: layout({
      title: `Reminder: ${r.title}`,
      preheader: `${when(r.starts_at, r.ends_at)} at ${loc}.`,
      heading: `${esc(r.title)} is lined up.`,
      body,
      footer: `You're getting this reminder because you hold a seat for ${esc(r.title)} on EvntCult.`,
      siteUrl: base,
    }),
    text,
    attachIcs: null,
  };
}

export function updatedEmail(r: Row, base: string) {
  const first = r.name.split(/\s+/)[0] || "there";
  const page = `${base}/events/${r.slug}`;
  const loc = placeOf(r);
  const body =
    P(`Heads up, ${esc(first)}: the time or venue for ${esc(r.title)} was just updated. We attached an updated calendar invite so your calendar stays in sync.`) +
    stub({
      title: r.title,
      rows: [
        ["New time", when(r.starts_at, r.ends_at)],
        ["Venue", loc],
        ...(r.host ? ([["Host", r.host]] as [string, string][]) : []),
      ],
      code: r.pass_code ? passName(r.pass_code).label : undefined,
    }) +
    button(page, "View updated details") +
    links([{ href: `${base}/passes`, label: "Open your pass" }]);
  const text = `Updated: ${r.title}\n\nNew time: ${when(r.starts_at, r.ends_at)}\nVenue: ${loc}\n\nView event: ${page}\nYour pass: ${base}/passes`;
  return {
    subject: `Updated: ${r.title}`,
    html: layout({
      title: `Updated: ${r.title}`,
      preheader: `Now ${when(r.starts_at, r.ends_at)} at ${loc}.`,
      heading: `Details changed for ${esc(r.title)}.`,
      body,
      footer: `You're getting this because you're registered for ${esc(r.title)} on EvntCult.`,
      siteUrl: base,
    }),
    text,
    attachIcs: "REQUEST" as const,
  };
}

export function announcementEmail(r: Row, base: string) {
  const page = `${base}/events/${r.slug}`;
  const data = JSON.parse(r.payload || "{}") as { kind?: string; message?: string };
  const kind = data.kind || "Update";
  const message = data.message || "The host posted a new update.";
  const body =
    P(`${esc(r.host ?? "The host")} posted a ${esc(kind.toLowerCase())} for ${esc(r.title)}:`) +
    note(r.host ?? "the host", message) +
    button(page, "Open event page") +
    links([{ href: `${base}/passes`, label: "Open your pass" }]);
  const text = `${kind} for ${r.title}\n\nFrom ${r.host ?? "the host"}:\n${message}\n\nEvent page: ${page}`;
  return {
    subject: `${kind}: ${r.title}`,
    html: layout({
      title: `${kind}: ${r.title}`,
      preheader: message.slice(0, 110),
      heading: `${esc(kind)} for ${esc(r.title)}`,
      body,
      footer: `You're getting this because you're registered for ${esc(r.title)} on EvntCult.`,
      siteUrl: base,
    }),
    text,
    attachIcs: null,
  };
}

export function cancelledEmail(r: Row, base: string) {
  const first = r.name.split(/\s+/)[0] || "there";
  const body =
    P(`Sorry, ${esc(first)}: ${esc(r.title)} scheduled for ${esc(when(r.starts_at, r.ends_at))} has been cancelled.`) +
    P(`We attached a cancellation invite so it clears from your calendar automatically.`, "color:#6A6A6A;font-size:14px") +
    button(`${base}/events`, "Browse other events");
  const text = `Cancelled: ${r.title}\n\nThe event scheduled for ${when(r.starts_at, r.ends_at)} has been cancelled.\n\nBrowse other events: ${base}/events`;
  return {
    subject: `Cancelled: ${r.title}`,
    html: layout({
      title: `Cancelled: ${r.title}`,
      preheader: `${r.title} has been cancelled.`,
      heading: `${esc(r.title)} was cancelled.`,
      body,
      footer: `You're getting this because you were registered for ${esc(r.title)} on EvntCult.`,
      siteUrl: base,
    }),
    text,
    attachIcs: "CANCEL" as const,
  };
}

export function feedbackEmail(r: Row, base: string) {
  const first = r.name.split(/\s+/)[0] || "there";
  const page = `${base}/events/${r.slug}`;
  const body =
    P(`Thanks for coming to ${esc(r.title)}, ${esc(first)}. ${esc(r.host ?? "The host")} reads every answer, and it takes ten seconds.`) +
    `<p style="margin:18px 0 4px;font-family:'Figtree',Helvetica,Arial,sans-serif;font-size:14px;font-weight:600;color:#1A1A1A">Tap a star</p>` +
    stars(page) +
    P(`You can add a line about what to keep or change on the next page.`, "margin-top:10px;color:#6A6A6A;font-size:13.5px") +
    links([{ href: `${page}#wall`, label: "Photos and the guest wall" }]);
  return {
    subject: `How was ${r.title}?`,
    html: layout({
      title: `How was ${r.title}?`,
      preheader: "One tap. The host reads every answer.",
      heading: `How was ${r.title}?`,
      body,
      footer: `You're getting this because you went to ${esc(r.title)}.`,
      siteUrl: base,
    }),
    text: `How was ${r.title}?\n\nRate it from 1 to 5 here: ${page}#feedback\n\nThanks for coming.`,
    attachIcs: null,
  };
}

/** Send queued emails. Called by the cron every minute. */
export async function flushEmail(db: D1Database, env: MailEnv, now = new Date()) {
  const due = await db
    .prepare(
      `SELECT n.id, n.template, n.payload, n.user_id, n.event_id, u.email, u.name, e.title, e.slug, e.starts_at, e.ends_at,
              e.venue, e.venue_address, e.venue_status, e.confirm_message, e.version AS event_version, e.status AS event_status,
              h.name AS host, r.pass_code,
              CASE WHEN r.status = 'waitlisted' AND e.requires_approval = 1 THEN 'pending' ELSE r.status END AS status
         FROM notifications n JOIN users u ON u.id = n.user_id JOIN events e ON e.id = n.event_id
         LEFT JOIN users h ON h.id = e.organizer_id
         LEFT JOIN registrations r ON r.event_id = n.event_id AND r.user_id = n.user_id
        WHERE n.channel = 'email' AND n.status = 'queued' AND n.scheduled_for <= ? ORDER BY n.scheduled_for LIMIT 25`,
    )
    .bind(now.toISOString())
    .all<Row>();
  const base = site(env);
  let sent = 0;
  for (const r of due.results ?? []) {
    const took = await db.prepare("UPDATE notifications SET status = 'sending', attempts = attempts + 1 WHERE id = ? AND status = 'queued'").bind(r.id).run();
    if ((took.meta.changes ?? 0) !== 1) continue;
    if (!r.email || r.email.endsWith(".invalid")) {
      await db.prepare("UPDATE notifications SET status = 'skipped', error = 'no_email' WHERE id = ?").bind(r.id).run();
      continue;
    }
    if (r.template !== "email_cancelled" && r.status === "cancelled") {
      await db.prepare("UPDATE notifications SET status = 'skipped', error = 'cancelled' WHERE id = ?").bind(r.id).run();
      continue;
    }
    if (r.template === "email_reminder" && (r.event_status !== "published" || Date.parse(r.starts_at) <= now.getTime())) {
      await db.prepare("UPDATE notifications SET status = 'skipped', error = 'too_late' WHERE id = ?").bind(r.id).run();
      continue;
    }
    const m =
      r.template === "email_feedback"
        ? feedbackEmail(r, base)
        : r.template === "email_reminder"
          ? reminderEmail(r, base)
          : r.template === "email_updated"
            ? updatedEmail(r, base)
            : r.template === "email_announcement"
              ? announcementEmail(r, base)
              : r.template === "email_cancelled"
                ? cancelledEmail(r, base)
                : registeredEmail(r, base);
    const attachments = m.attachIcs ? [inviteAttachment(r, base, env.EMAIL_FROM, m.attachIcs)] : undefined;
    try {
      const res = await sendEmail(env, { email: r.email, name: r.name }, m.subject, m.html, m.text, attachments);
      await db.prepare("UPDATE notifications SET status = ?, sent_at = ? WHERE id = ?").bind(res.dry ? "dry_run" : "sent", now.toISOString(), r.id).run();
      sent++;
    } catch (err) {
      await db.prepare("UPDATE notifications SET status = 'failed', error = ? WHERE id = ?").bind(String(err).slice(0, 300), r.id).run();
    }
  }
  return sent;
}

async function queue(db: D1Database, userId: string, eventId: string, template: string, key: string, at: Date, payload = "{}") {
  await db
    .prepare(
      `INSERT OR IGNORE INTO notifications (id, user_id, event_id, channel, template, payload, status, created_at, scheduled_for, dedupe_key)
       VALUES (?, ?, ?, 'email', ?, ?, 'queued', ?, ?, ?)`,
    )
    .bind(crypto.randomUUID(), userId, eventId, template, payload, new Date().toISOString(), at.toISOString(), key)
    .run();
}

/** Queue the confirmation email for a new registration. Safe to call twice. */
export const queueRegisteredEmail = (db: D1Database, userId: string, eventId: string, now = new Date()) =>
  queue(db, userId, eventId, "email_registered", `email:reg:${eventId}:${userId}`, now);

/** Queue 24-hour reminder emails for published events starting within the next 24 hours. */
export async function queueReminderEmails(db: D1Database, now = new Date()) {
  const soon = new Date(now.getTime() + 2 * 3_600_000).toISOString();
  const horizon = new Date(now.getTime() + 24 * 3_600_000).toISOString();
  await db
    .prepare(
      `INSERT OR IGNORE INTO notifications (id, user_id, event_id, channel, template, payload, status, created_at, scheduled_for, dedupe_key)
       SELECT lower(hex(randomblob(16))), r.user_id, r.event_id, 'email', 'email_reminder', '{}', 'queued', ?1, ?1,
              'email:rem:' || r.event_id || ':' || e.starts_at || ':' || r.user_id
         FROM registrations r JOIN events e ON e.id = r.event_id
        WHERE e.status = 'published' AND e.starts_at BETWEEN ?2 AND ?3 AND r.status = 'registered'`,
    )
    .bind(now.toISOString(), soon, horizon)
    .run();
}

/** Queue venue/time-updated emails (with updated .ics) 5 minutes after the last edit, or immediately if < 2h away. */
export async function queueEventUpdatedEmails(db: D1Database, eventId: string, startsAt: string, now = new Date()) {
  const soon = Date.parse(startsAt) - now.getTime() < 2 * 3_600_000;
  const due = new Date(now.getTime() + (soon ? 0 : 5 * 60_000)).toISOString();
  await db.batch([
    db.prepare("DELETE FROM notifications WHERE event_id = ? AND channel = 'email' AND status = 'queued' AND template IN ('email_updated','email_reminder')").bind(eventId),
    db
      .prepare(
        `INSERT OR IGNORE INTO notifications (id, user_id, event_id, channel, template, payload, status, created_at, scheduled_for, dedupe_key)
         SELECT lower(hex(randomblob(16))), r.user_id, r.event_id, 'email', 'email_updated', '{}', 'queued', ?1, ?2,
                'email:upd:' || r.event_id || ':' || ?3 || ':' || r.user_id
           FROM registrations r
          WHERE r.event_id = ?4 AND r.status = 'registered'`,
      )
      .bind(now.toISOString(), due, String(now.getTime()), eventId),
  ]);
}

/** Queue an email blast for all registered guests whenever an organizer posts an update/announcement. */
export async function queueAnnouncementEmails(
  db: D1Database,
  eventId: string,
  updateId: string,
  kind: string,
  message: string,
  now = new Date(),
) {
  const payload = JSON.stringify({ kind, message: message.slice(0, 1000) });
  await db
    .prepare(
      `INSERT OR IGNORE INTO notifications (id, user_id, event_id, channel, template, payload, status, created_at, scheduled_for, dedupe_key)
       SELECT lower(hex(randomblob(16))), r.user_id, r.event_id, 'email', 'email_announcement', ?1, 'queued', ?2, ?2,
              'email:ann:' || ?3 || ':' || r.user_id
         FROM registrations r
        WHERE r.event_id = ?4 AND r.status = 'registered'`,
    )
    .bind(payload, now.toISOString(), updateId, eventId)
    .run();
}

/** Queue cancellation emails (with METHOD:CANCEL .ics) for all registered guests. */
export async function queueCancelledEmails(db: D1Database, eventId: string, now = new Date()) {
  await db.batch([
    db.prepare("DELETE FROM notifications WHERE event_id = ? AND channel = 'email' AND status = 'queued' AND template IN ('email_updated','email_reminder')").bind(eventId),
    db
      .prepare(
        `INSERT OR IGNORE INTO notifications (id, user_id, event_id, channel, template, payload, status, created_at, scheduled_for, dedupe_key)
         SELECT lower(hex(randomblob(16))), r.user_id, r.event_id, 'email', 'email_cancelled', '{}', 'queued', ?1, ?1,
                'email:can:' || r.event_id || ':' || r.user_id
           FROM registrations r
          WHERE r.event_id = ?2 AND r.status = 'registered'`,
      )
      .bind(now.toISOString(), eventId),
  ]);
}

/** Two hours after an event ends, ask everyone who came (or held a seat) how it was. */
export async function queueFeedbackEmails(db: D1Database, now = new Date()) {
  const from = new Date(now.getTime() - 26 * 3_600_000).toISOString();
  const to = new Date(now.getTime() - 2 * 3_600_000).toISOString();
  const rows = await db
    .prepare(
      `SELECT r.user_id, r.event_id FROM registrations r JOIN events e ON e.id = r.event_id
        WHERE e.status IN ('published','closed') AND e.ends_at BETWEEN ? AND ? AND r.status = 'registered'
          AND NOT EXISTS (SELECT 1 FROM event_feedback f WHERE f.event_id = r.event_id AND f.user_id = r.user_id)
        LIMIT 500`,
    )
    .bind(from, to)
    .all<{ user_id: string; event_id: string }>();
  for (const r of rows.results ?? []) await queue(db, r.user_id, r.event_id, "email_feedback", `email:fb:${r.event_id}:${r.user_id}`, now);
}
