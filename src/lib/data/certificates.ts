/**
 * Certificates. Only someone whose pass was scanned in can hold one: that is the proof.
 * Issued automatically at check-in, in bulk, or per person with a special kind.
 * Takes the D1 database as an argument so tests can use it directly.
 */
import { newId } from "@/lib/tokens";
import { ActionError } from "@/lib/data/organizer-actions";
import { enqueueCertificateReady } from "@/lib/whatsapp";

export const CERT_KINDS = ["participation", "winner", "volunteer", "speaker"] as const;
export type CertKind = (typeof CERT_KINDS)[number];
export const CERT_UNDONE = "check-in undone";

export interface Certificate {
  id: string;
  publicCode: string;
  kind: CertKind;
  issuedAt: string;
  registrationId: string;
  userId: string;
  name: string;
  eventId: string;
  eventSlug: string;
  eventTitle: string;
  venue: string | null;
  startsAt: string;
  organizerId: string;
  organizerName: string;
}

export interface VerifiedCertificate {
  name: string;
  eventTitle: string;
  kind: CertKind;
  issuedAt: string;
  organizerName: string;
  revokedAt: string | null;
  revokedReason: string | null;
}

/** 8 characters from a 32-letter alphabet with no O, 0, I or 1. */
export function newPublicCode(): string {
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  return [...crypto.getRandomValues(new Uint8Array(8))].map((b) => alphabet[b % 32]).join("");
}

const SELECT = `SELECT ct.id, ct.public_code, ct.kind, ct.issued_at, ct.registration_id, r.user_id, u.name,
                       e.id AS event_id, e.slug, e.title, e.venue, e.starts_at, e.organizer_id, o.name AS organizer_name
                  FROM certificates ct
                  JOIN registrations r ON r.id = ct.registration_id
                  JOIN users u ON u.id = r.user_id
                  JOIN events e ON e.id = ct.event_id
                  JOIN users o ON o.id = e.organizer_id`;

type Row = {
  id: string;
  public_code: string;
  kind: CertKind;
  issued_at: string;
  registration_id: string;
  user_id: string;
  name: string;
  event_id: string;
  slug: string;
  title: string;
  venue: string | null;
  starts_at: string;
  organizer_id: string;
  organizer_name: string;
};

const toCert = (r: Row): Certificate => ({
  id: r.id,
  publicCode: r.public_code,
  kind: r.kind,
  issuedAt: r.issued_at,
  registrationId: r.registration_id,
  userId: r.user_id,
  name: r.name,
  eventId: r.event_id,
  eventSlug: r.slug,
  eventTitle: r.title,
  venue: r.venue,
  startsAt: r.starts_at,
  organizerId: r.organizer_id,
  organizerName: r.organizer_name,
});

/** Every valid certificate a person holds, newest event first. */
export async function myCertificates(db: D1Database, userId: string): Promise<Certificate[]> {
  const rows = await db.prepare(`${SELECT} WHERE r.user_id = ? AND ct.revoked_at IS NULL ORDER BY e.starts_at DESC`).bind(userId).all<Row>();
  return (rows.results ?? []).map(toCert);
}

/** One certificate, for its holder, the event's organizer or an admin. Anyone else gets null. */
export async function certificateFor(db: D1Database, id: string, viewer: { id: string; role: string }): Promise<Certificate | null> {
  const row = await db.prepare(`${SELECT} WHERE ct.id = ? AND ct.revoked_at IS NULL`).bind(id).first<Row>();
  if (!row) return null;
  return row.user_id === viewer.id || row.organizer_id === viewer.id || viewer.role === "admin" ? toCert(row) : null;
}

/** The public check. A revoked certificate still resolves, so it never looks like a broken link. */
export async function verifyCertificate(db: D1Database, code: string): Promise<VerifiedCertificate | null> {
  const row = await db
    .prepare(
      `SELECT u.name, e.title, ct.kind, ct.issued_at, o.name AS organizer_name, ct.revoked_at, ct.revoked_reason
         FROM certificates ct JOIN registrations r ON r.id = ct.registration_id JOIN users u ON u.id = r.user_id
         JOIN events e ON e.id = ct.event_id JOIN users o ON o.id = e.organizer_id
        WHERE ct.public_code = ?`,
    )
    .bind(code.trim().toUpperCase())
    .first<{ name: string; title: string; kind: CertKind; issued_at: string; organizer_name: string; revoked_at: string | null; revoked_reason: string | null }>();
  return row ? { name: row.name, eventTitle: row.title, kind: row.kind, issuedAt: row.issued_at, organizerName: row.organizer_name, revokedAt: row.revoked_at, revokedReason: row.revoked_reason } : null;
}

const insertCert = (db: D1Database, registrationId: string, eventId: string, kind: CertKind, at: string) =>
  db
    .prepare(
      `INSERT INTO certificates (id, registration_id, event_id, public_code, kind, issued_at) VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT (registration_id, kind) DO UPDATE SET revoked_at = NULL, revoked_reason = NULL, issued_at = excluded.issued_at
       WHERE certificates.revoked_reason = '${CERT_UNDONE}'`,
    )
    .bind(`cert_${newId()}`, registrationId, eventId, newPublicCode(), kind, at);

/**
 * Called when a pass is admitted. A re-scan creates nothing. A check-in that was undone and
 * then redone brings the same certificate back. One an organizer revoked stays revoked.
 */
export async function issueOnCheckIn(db: D1Database, registrationId: string, eventId: string, now = new Date()) {
  const event = await db.prepare("SELECT certificates_enabled FROM events WHERE id = ?").bind(eventId).first<{ certificates_enabled: number }>();
  if (event?.certificates_enabled) await insertCert(db, registrationId, eventId, "participation", now.toISOString()).run();
}

async function audit(db: D1Database, actorId: string | null, action: string, targetId: string, meta: Record<string, unknown>, now: Date) {
  await db.prepare("INSERT INTO audit_log (id, actor_id, action, target_id, meta, created_at) VALUES (?, ?, ?, ?, ?, ?)").bind(newId(), actorId, action, targetId, JSON.stringify(meta), now.toISOString()).run();
}

/** The one button: a certificate for everyone currently checked in who doesn't have one. */
export async function issueBulk(db: D1Database, eventId: string, actorId: string, now = new Date()): Promise<{ issued: number }> {
  const rows = await db
    .prepare(
      `SELECT c.registration_id AS id FROM checkins c
        WHERE c.event_id = ? AND c.undone_at IS NULL AND NOT EXISTS (SELECT 1 FROM certificates ct WHERE ct.registration_id = c.registration_id AND ct.kind = 'participation')`,
    )
    .bind(eventId)
    .all<{ id: string }>();
  const ids = (rows.results ?? []).map((r) => r.id);
  for (let i = 0; i < ids.length; i += 50) await db.batch(ids.slice(i, i + 50).map((id) => insertCert(db, id, eventId, "participation", now.toISOString())));
  await audit(db, actorId, "certificates_issue", eventId, { issued: ids.length }, now);
  if (ids.length) await enqueueCertificateReady(db, eventId, now);
  return { issued: ids.length };
}

/** One person, any kind. Still only for someone who actually checked in. */
export async function issueOne(db: D1Database, registrationId: string, kind: CertKind, actorId: string, now = new Date()) {
  const reg = await db.prepare("SELECT event_id FROM checkins WHERE registration_id = ? AND undone_at IS NULL").bind(registrationId).first<{ event_id: string }>();
  if (!reg) throw new ActionError(409, "not_checked_in", "Only people who checked in can get a certificate.");
  const exists = await db.prepare("SELECT revoked_at, revoked_reason FROM certificates WHERE registration_id = ? AND kind = ?").bind(registrationId, kind).first<{ revoked_at: string | null; revoked_reason: string | null }>();
  if (exists && !exists.revoked_at) throw new ActionError(409, "already_issued", "They already have this certificate.");
  if (exists) await db.prepare("UPDATE certificates SET revoked_at = NULL, revoked_reason = NULL, issued_at = ? WHERE registration_id = ? AND kind = ?").bind(now.toISOString(), registrationId, kind).run();
  else await insertCert(db, registrationId, reg.event_id, kind, now.toISOString()).run();
  await audit(db, actorId, "certificate_issue", registrationId, { kind }, now);
}

export async function certificateEvent(db: D1Database, id: string) {
  return (await db.prepare("SELECT event_id FROM certificates WHERE id = ?").bind(id).first<{ event_id: string }>())?.event_id ?? null;
}

export async function revokeCertificate(db: D1Database, id: string, reason: string, actorId: string, now = new Date()) {
  const res = await db.prepare("UPDATE certificates SET revoked_at = ?, revoked_reason = ? WHERE id = ? AND revoked_at IS NULL").bind(now.toISOString(), reason, id).run();
  if (!res.meta.changes) throw new ActionError(409, "already_revoked", "This certificate is already revoked.");
  await audit(db, actorId, "certificate_revoke", id, { reason }, now);
}

/** Removes a mistaken check-in. Their attendance certificate is withdrawn with it. */
export async function undoCheckIn(db: D1Database, registrationId: string, actorId: string, now = new Date()) {
  // §11: nothing is deleted. The row is marked undone, and stops counting everywhere.
  const res = await db
    .prepare("UPDATE checkins SET undone_at = ?, undone_by = ? WHERE registration_id = ? AND undone_at IS NULL")
    .bind(now.toISOString(), actorId, registrationId)
    .run();
  if (!res.meta.changes) throw new ActionError(409, "not_checked_in", "This pass isn't checked in.");
  await db.prepare("UPDATE certificates SET revoked_at = ?, revoked_reason = ? WHERE registration_id = ? AND revoked_at IS NULL").bind(now.toISOString(), CERT_UNDONE, registrationId).run();
  await audit(db, actorId, "checkin_undo", registrationId, {}, now);
}

export interface AttendeeCert {
  id: string;
  registrationId: string;
  kind: CertKind;
}

export async function eventCertificates(db: D1Database, eventId: string): Promise<AttendeeCert[]> {
  const rows = await db.prepare("SELECT id, registration_id, kind FROM certificates WHERE event_id = ? AND revoked_at IS NULL").bind(eventId).all<{ id: string; registration_id: string; kind: CertKind }>();
  return (rows.results ?? []).map((r) => ({ id: r.id, registrationId: r.registration_id, kind: r.kind }));
}

export async function setCertificatesEnabled(db: D1Database, eventId: string, enabled: boolean) {
  await db.prepare("UPDATE events SET certificates_enabled = ? WHERE id = ?").bind(enabled ? 1 : 0, eventId).run();
}
