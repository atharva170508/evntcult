/**
 * Event emails: the registration confirmation (with the host's note) and the "How was it?"
 * request after an event. Queued in the notifications table with channel 'email' and sent by the
 * cron, through Brevo, so a slow mail API never slows down registering.
 */
import { button, esc, layout, links, note, P, stars, stub } from "./mail-kit";

type MailEnv = { BREVO_API_KEY?: string; EMAIL_FROM?: string; EMAIL_PROVIDER?: string; NEXT_PUBLIC_SITE_URL?: string };
const site = (env: MailEnv) => (env.NEXT_PUBLIC_SITE_URL || "https://evntcult.caliper.workers.dev").replace(/\/$/, "");

const IST = { timeZone: "Asia/Kolkata" } as const;
const when = (startIso: string, endIso: string) => {
  const s = new Date(startIso);
  const e = new Date(endIso);
  const day = s.toLocaleDateString("en-IN", { ...IST, weekday: "long", day: "numeric", month: "long" });
  const t = (d: Date) => d.toLocaleTimeString("en-IN", { ...IST, hour: "numeric", minute: "2-digit" }).toLowerCase();
  return `${day}, ${t(s)} to ${t(e)}`;
};

export async function sendEmail(env: MailEnv, to: { email: string; name?: string }, subject: string, html: string, text: string) {
  if (env.EMAIL_PROVIDER === "log" && !env.BREVO_API_KEY) {
    console.log(`[email:log] to ${to.email}: ${subject}`);
    return { dry: true };
  }
  if (!env.BREVO_API_KEY || !env.EMAIL_FROM) return { dry: true };
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": env.BREVO_API_KEY, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ sender: { name: "EvntCult", email: env.EMAIL_FROM }, to: [to], subject, textContent: text, htmlContent: html }),
  });
  if (!res.ok) throw new Error(`brevo ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return { dry: false };
}

type Row = {
  id: string; template: string; user_id: string; event_id: string; email: string; name: string;
  title: string; slug: string; starts_at: string; ends_at: string; venue: string | null; venue_address: string | null;
  confirm_message: string | null; host: string | null; pass_code: string | null; status: string | null;
};

export function registeredEmail(r: Row, base: string) {
  const first = r.name.split(/\s+/)[0] || "there";
  const waiting = r.status === "waitlisted";
  const pending = r.status === "pending";
  const heading = waiting ? `You're on the waitlist, ${first}.` : pending ? `Request sent, ${first}.` : `You're in, ${first}.`;
  const page = `${base}/events/${r.slug}`;
  const body =
    P(
      waiting
        ? `${esc(r.title)} is full right now. If a seat opens, we'll hold it for you and tell you straight away.`
        : pending
          ? `${esc(r.host ?? "The host")} approves each guest for ${esc(r.title)}. You'll get your pass as soon as they say yes.`
          : `Your seat at ${esc(r.title)} is confirmed. Show the pass below at the gate; it works without internet.`,
    ) +
    stub({
      title: r.title,
      rows: [
        ["When", when(r.starts_at, r.ends_at)],
        ["Where", [r.venue, r.venue_address].filter(Boolean).join(", ") || "Venue to be announced"],
        ...(r.host ? ([["Host", r.host]] as [string, string][]) : []),
      ],
      code: !waiting && !pending ? (r.pass_code ?? undefined) : undefined,
    }) +
    (r.confirm_message ? note(r.host ?? "the host", r.confirm_message) : "") +
    button(waiting || pending ? page : `${base}/passes`, waiting || pending ? "See the event" : "Open your pass") +
    links([
      { href: `${base}/api/events/${r.slug}/ics`, label: "Add to calendar" },
      { href: page, label: "Event page" },
    ]);
  const text = `${heading}\n\n${r.title}\n${when(r.starts_at, r.ends_at)}\n${r.venue ?? "Venue to be announced"}\n${r.pass_code && !waiting && !pending ? `Pass: ${r.pass_code}\n` : ""}${r.confirm_message ? `\nA note from ${r.host ?? "the host"}:\n${r.confirm_message}\n` : ""}\nYour pass: ${base}/passes\nEvent page: ${page}`;
  return {
    subject: waiting ? `Waitlist: ${r.title}` : pending ? `Request sent: ${r.title}` : `You're in: ${r.title}`,
    html: layout({
      title: r.title,
      preheader: waiting ? "We'll tell you if a seat opens." : `${when(r.starts_at, r.ends_at)}. Your pass is inside.`,
      heading,
      body,
      footer: `You're getting this because you registered for ${esc(r.title)} on EvntCult.`,
      siteUrl: base,
    }),
    text,
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
  };
}

/** Send queued emails. Called by the cron every minute. */
export async function flushEmail(db: D1Database, env: MailEnv, now = new Date()) {
  const due = await db
    .prepare(
      `SELECT n.id, n.template, n.user_id, n.event_id, u.email, u.name, e.title, e.slug, e.starts_at, e.ends_at, e.venue, e.venue_address,
              e.confirm_message, h.name AS host, r.pass_code,
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
    if (r.template === "email_registered" && r.status === "cancelled") {
      await db.prepare("UPDATE notifications SET status = 'skipped', error = 'cancelled' WHERE id = ?").bind(r.id).run();
      continue;
    }
    const m = r.template === "email_feedback" ? feedbackEmail(r, base) : registeredEmail(r, base);
    try {
      const res = await sendEmail(env, { email: r.email, name: r.name }, m.subject, m.html, m.text);
      await db.prepare("UPDATE notifications SET status = ?, sent_at = ? WHERE id = ?").bind(res.dry ? "dry_run" : "sent", now.toISOString(), r.id).run();
      sent++;
    } catch (err) {
      await db.prepare("UPDATE notifications SET status = 'failed', error = ? WHERE id = ?").bind(String(err).slice(0, 300), r.id).run();
    }
  }
  return sent;
}

async function queue(db: D1Database, userId: string, eventId: string, template: string, key: string, at: Date) {
  await db
    .prepare(
      `INSERT OR IGNORE INTO notifications (id, user_id, event_id, channel, template, payload, status, created_at, scheduled_for, dedupe_key)
       VALUES (?, ?, ?, 'email', ?, '{}', 'queued', ?, ?, ?)`,
    )
    .bind(crypto.randomUUID(), userId, eventId, template, new Date().toISOString(), at.toISOString(), key)
    .run();
}

/** Queue the confirmation email for a new registration. Safe to call twice. */
export const queueRegisteredEmail = (db: D1Database, userId: string, eventId: string, now = new Date()) =>
  queue(db, userId, eventId, "email_registered", `email:reg:${eventId}:${userId}`, now);

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
