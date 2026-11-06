/**
 * Certificates of attendance (M8). A certificate exists for every registration that was
 * checked in at the gate: being scanned in is the proof. Nothing is stored; the page is
 * built from the registration + check-in rows, so it can't drift from what happened.
 * Takes the D1 database as an argument so tests can use it directly.
 */
export interface Certificate {
  id: string; // registration id (also the certificate ID)
  userId: string;
  name: string;
  eventId: string;
  eventSlug: string;
  eventTitle: string;
  venue: string;
  startsAt: string;
  endsAt: string;
  organizerId: string;
  organizerName: string;
  checkedInAt: string;
}

const SELECT = `SELECT r.id, r.user_id, u.name, e.id AS event_id, e.slug, e.title, e.venue, e.starts_at, e.ends_at,
                       e.organizer_id, o.name AS organizer_name, c.scanned_at
                  FROM registrations r
                  JOIN checkins c ON c.registration_id = r.id
                  JOIN users u ON u.id = r.user_id
                  JOIN events e ON e.id = r.event_id
                  JOIN users o ON o.id = e.organizer_id`;

type Row = {
  id: string;
  user_id: string;
  name: string;
  event_id: string;
  slug: string;
  title: string;
  venue: string;
  starts_at: string;
  ends_at: string;
  organizer_id: string;
  organizer_name: string;
  scanned_at: string;
};

const toCert = (r: Row): Certificate => ({
  id: r.id,
  userId: r.user_id,
  name: r.name,
  eventId: r.event_id,
  eventSlug: r.slug,
  eventTitle: r.title,
  venue: r.venue,
  startsAt: r.starts_at,
  endsAt: r.ends_at,
  organizerId: r.organizer_id,
  organizerName: r.organizer_name,
  checkedInAt: r.scanned_at,
});

/** Every certificate a student has earned, newest event first. */
export async function myCertificates(db: D1Database, userId: string): Promise<Certificate[]> {
  const rows = await db.prepare(`${SELECT} WHERE r.user_id = ? ORDER BY e.starts_at DESC`).bind(userId).all<Row>();
  return rows.results.map(toCert);
}

/**
 * One certificate, only for people allowed to see it: the student it belongs to,
 * the event's organizer, or an admin. Anyone else gets null (same as "doesn't exist").
 */
export async function certificateFor(db: D1Database, id: string, viewer: { id: string; role: string }): Promise<Certificate | null> {
  const row = await db.prepare(`${SELECT} WHERE r.id = ?`).bind(id).first<Row>();
  if (!row) return null;
  const allowed = row.user_id === viewer.id || row.organizer_id === viewer.id || viewer.role === "admin";
  return allowed ? toCert(row) : null;
}
