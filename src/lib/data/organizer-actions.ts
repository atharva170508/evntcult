/**
 * Organizer actions on one event: mark paid / unpaid, post an update, list attendees, CSV.
 * Takes the D1 database as an argument (no "server-only"), like registrations.ts, so it's testable.
 * Permission checks happen in the API routes (requireEventOwner) before these are called.
 */
import { newId } from "@/lib/tokens";
import { notifyRegistered } from "@/lib/notify";

export class ActionError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

async function audit(db: D1Database, actorId: string, action: string, targetId: string, meta: Record<string, unknown>, now: Date) {
  await db
    .prepare("INSERT INTO audit_log (id, actor_id, action, target_id, meta, created_at) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(newId(), actorId, action, targetId, JSON.stringify(meta), now.toISOString())
    .run();
}

/* ─── Payment reconcile ─────────────────────────────────────────────────── */

export type PaymentChange = { status: "paid"; method: "cash" | "upi"; ref?: string | null } | { status: "unpaid" };

/** The event a registration belongs to (for the permission check). */
export async function registrationEvent(db: D1Database, regId: string) {
  return (
    (await db
      .prepare("SELECT r.id, r.event_id, r.status, r.payment_status, e.price_paise FROM registrations r JOIN events e ON e.id = r.event_id WHERE r.id = ?")
      .bind(regId)
      .first<{ id: string; event_id: string; status: string; payment_status: string; price_paise: number }>()) ?? null
  );
}

/** Mark a registration paid (with method) or unpaid (undo). Every change is audited. */
export async function setPayment(db: D1Database, regId: string, actorId: string, change: PaymentChange, now = new Date()) {
  const reg = await registrationEvent(db, regId);
  if (!reg) throw new ActionError(404, "not_found", "Registration not found.");
  if (reg.price_paise === 0) throw new ActionError(409, "free_event", "This is a free event: there's nothing to pay.");
  if (reg.status === "cancelled") throw new ActionError(409, "cancelled", "This registration was cancelled.");

  if (change.status === "paid") {
    await db
      .prepare("UPDATE registrations SET payment_status = 'paid', payment_method = ?, payment_ref = ?, paid_at = ?, paid_by = ? WHERE id = ?")
      .bind(change.method, change.ref ?? null, now.toISOString(), actorId, regId)
      .run();
  } else {
    await db
      .prepare("UPDATE registrations SET payment_status = 'unpaid', payment_method = NULL, payment_ref = NULL, paid_at = NULL, paid_by = NULL WHERE id = ?")
      .bind(regId)
      .run();
  }
  await audit(db, actorId, "payment", regId, { event_id: reg.event_id, from: reg.payment_status, to: change.status, ...(change.status === "paid" ? { method: change.method, ref: change.ref ?? null } : {}) }, now);
  return { id: regId, payment_status: change.status };
}

/* ─── Event updates ─────────────────────────────────────────────────────── */

export type UpdateKind = "schedule" | "venue" | "update";
const KIND_LABEL: Record<UpdateKind, string> = { schedule: "Schedule change", venue: "Venue change", update: "Update" };

/** Post an update to an event's page and dashboards; optionally queue it for WhatsApp. */
export async function postEventUpdate(
  db: D1Database,
  input: { eventId: string; actorId: string; kind: UpdateKind; body: string; whatsapp: boolean },
  now = new Date(),
): Promise<{ id: string; queued: number }> {
  const event = await db.prepare("SELECT id, title, status FROM events WHERE id = ?").bind(input.eventId).first<{ id: string; title: string; status: string }>();
  if (!event) throw new ActionError(404, "not_found", "Event not found.");
  if (event.status === "draft") throw new ActionError(409, "draft", "Publish the event before posting updates.");

  const id = newId();
  await db
    .prepare("INSERT INTO event_updates (id, event_id, kind, body, created_at, notified) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(id, event.id, input.kind, input.body, now.toISOString(), input.whatsapp ? 1 : 0)
    .run();
  const queued = input.whatsapp
    ? await notifyRegistered(db, event.id, "event_update", { event_title: event.title, message: `${KIND_LABEL[input.kind]}: ${input.body}` }, `update:${id}`, now)
    : 0;
  await audit(db, input.actorId, "event_update", event.id, { update_id: id, kind: input.kind, whatsapp_queued: queued }, now);
  return { id, queued };
}

/* ─── Attendees ─────────────────────────────────────────────────────────── */

export interface AttendeeRow {
  id: string;
  name: string;
  email: string;
  status: "registered" | "waitlisted" | "cancelled";
  pass_code: string;
  payment_status: "paid" | "unpaid";
  payment_method: string | null;
  payment_ref: string | null;
  paid_at: string | null;
  registered_at: string;
  checked_in_at: string | null;
  hold_expires_at: string | null;
}

/**
 * Everyone who registered or is waiting, newest first. Deliberately NO phone numbers:
 * organizers never see students' numbers (WhatsApp goes through the outbox instead).
 */
export async function listAttendees(db: D1Database, eventId: string, q?: string | null): Promise<AttendeeRow[]> {
  const search = q?.trim();
  const like = search ? `%${search.replace(/[\\%_]/g, (m) => `\\${m}`)}%` : null;
  const rows = await db
    .prepare(
      `SELECT r.id, u.name, u.email, r.status, r.pass_code, r.payment_status, r.payment_method, r.payment_ref, r.paid_at,
              r.created_at AS registered_at, c.scanned_at AS checked_in_at, r.hold_expires_at
         FROM registrations r JOIN users u ON u.id = r.user_id LEFT JOIN checkins c ON c.registration_id = r.id
        WHERE r.event_id = ? AND r.status IN ('registered','waitlisted')
          ${like ? "AND (u.name LIKE ?2 ESCAPE '\\' OR u.email LIKE ?2 ESCAPE '\\' OR r.pass_code LIKE ?2 ESCAPE '\\')" : ""}
        ORDER BY r.status = 'waitlisted', r.created_at DESC`,
    )
    .bind(...(like ? [eventId, like] : [eventId]))
    .all<AttendeeRow>();
  return rows.results ?? [];
}

/* ─── CSV ───────────────────────────────────────────────────────────────── */

/**
 * One CSV cell. Quotes when needed, and defuses spreadsheet formulas: a cell starting with
 * = + - @ (or a tab/CR) is prefixed with ' so Excel/Sheets show it as text instead of running it.
 */
export function csvCell(value: string | number | null | undefined): string {
  let s = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const ist = (iso: string | null) =>
  iso ? new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short", hour12: true }).format(new Date(iso)) : "";

/** Attendee CSV (opens in Excel / Google Sheets). No phone numbers. */
export function attendeesCsv(rows: AttendeeRow[], pricePaise: number): string {
  const header = ["Name", "Email", "Pass code", "Status", "Checked in (IST)", ...(pricePaise > 0 ? ["Payment", "Method", "UPI reference", "Paid at (IST)"] : []), "Registered (IST)"];
  const lines = rows.map((r) =>
    [
      r.name,
      r.email,
      r.pass_code,
      r.status === "waitlisted" ? (r.hold_expires_at ? "Waitlist (seat held)" : "Waitlist") : "Registered",
      ist(r.checked_in_at),
      ...(pricePaise > 0 ? [r.payment_status === "paid" ? "Paid" : "Unpaid", r.payment_method ?? "", r.payment_ref ?? "", ist(r.paid_at)] : []),
      ist(r.registered_at),
    ]
      .map(csvCell)
      .join(","),
  );
  // BOM so Excel opens UTF-8 names (e.g. accented or Indic characters) correctly.
  return "﻿" + [header.map(csvCell).join(","), ...lines].join("\r\n") + "\r\n";
}
