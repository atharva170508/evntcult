/**
 * The organizer side of an event: drafts, autosave, publish, duplicate, short links, calendar.
 *
 * Every function takes the D1 database so the rules can be tested against a real local D1.
 * Every write bumps `version` and appends to audit_log. A save carrying an old version gets a
 * 409, which is how two open tabs are caught. D1 has no interactive transactions, so each
 * guard sits inside the one SQL statement that needs it.
 */
import { detectClashes, type Clash } from "@/lib/clash";
import { bufferFor } from "@/lib/venues";
import { newAccessCode, newId } from "@/lib/tokens";
import type { EventRow } from "@/lib/data/types";
import { istToIso, istDate, istTime, missingForPublish, normalizeCode, slugify, type CalendarEvent, type PublishField } from "@/lib/organizer/shared";

export class OrganizerError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public extra: Record<string, unknown> = {},
  ) {
    super(message);
  }
}

export interface Owner {
  id: string;
  role: string;
}

export interface EventFields {
  title?: string;
  slug?: string;
  tagline?: string | null;
  description?: string | null;
  category?: string | null;
  venue?: string | null;
  venueStatus?: "confirmed" | "tba" | "online";
  date?: string;
  time?: string;
  durationMinutes?: number;
  capacity?: number | null;
  pricePaise?: number;
  payoutUpi?: string | null;
  access?: "public" | "code";
  accessCode?: string | null;
}

const SEATS = "(SELECT COUNT(*) FROM registrations r WHERE r.event_id = events.id AND r.status IN ('registered','waitlisted'))";

async function audit(db: D1Database, actor: string, action: string, target: string, meta: Record<string, unknown>, now: Date) {
  await db.prepare("INSERT INTO audit_log (id, actor_id, action, target_id, meta, created_at) VALUES (?, ?, ?, ?, ?, ?)").bind(newId(), actor, action, target, JSON.stringify(meta), now.toISOString()).run();
}

const isUnique = (e: unknown, what: string) => e instanceof Error && /UNIQUE/i.test(e.message) && e.message.includes(what);

async function freeSlug(db: D1Database, wanted: string, exceptId?: string): Promise<string> {
  const base = slugify(wanted);
  for (let n = 1; n < 500; n++) {
    const candidate = n === 1 ? base : `${base.slice(0, 56)}-${n}`;
    const row = await db.prepare("SELECT id FROM events WHERE slug = ?").bind(candidate).first<{ id: string }>();
    if (!row || row.id === exceptId) return candidate;
  }
  throw new OrganizerError(409, "slug_taken", "Pick a different link for this event.");
}

/** The venue this organizer used last, so a new event starts with it filled in. */
export async function lastVenue(db: D1Database, ownerId: string): Promise<string | null> {
  const row = await db
    .prepare("SELECT venue FROM events WHERE organizer_id = ? AND venue IS NOT NULL AND venue_status = 'confirmed' ORDER BY created_at DESC, rowid DESC LIMIT 1")
    .bind(ownerId)
    .first<{ venue: string }>();
  return row?.venue ?? null;
}

export async function defaultPayoutUpi(db: D1Database, ownerId: string): Promise<string | null> {
  return (await db.prepare("SELECT default_payout_upi AS u FROM users WHERE id = ?").bind(ownerId).first<{ u: string | null }>())?.u ?? null;
}

/** First save of a new event. Hosting makes an attendee an organizer, so the tools for their own events work. */
export async function createDraft(db: D1Database, owner: Owner, input: EventFields & { title: string }, now = new Date()) {
  const date = input.date ?? istDate(now);
  const time = input.time ?? "18:00";
  const startsAt = istToIso(date, time);
  const endsAt = new Date(Date.parse(startsAt) + (input.durationMinutes ?? 120) * 60_000).toISOString();
  const id = newId();
  const slug = await freeSlug(db, input.slug || input.title);
  const venue = input.venue === undefined ? await lastVenue(db, owner.id) : input.venue;
  const capacity = input.capacity === undefined ? 100 : input.capacity;
  const access = input.access ?? "public";
  const code = access === "code" ? (input.accessCode ? normalizeCode(input.accessCode) : newAccessCode()) : null;
  const iso = now.toISOString();
  try {
    await db
      .prepare(
        `INSERT INTO events (id, slug, organizer_id, title, tagline, description, category, venue, venue_status, starts_at, ends_at, capacity,
                             price_paise, organizer_upi_id, access, access_code, status, version, created_at, updated_at)
         VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16,'draft',1,?17,?17)`,
      )
      .bind(id, slug, owner.id, input.title, input.tagline ?? null, input.description ?? null, input.category ?? null, venue, input.venueStatus ?? "confirmed", startsAt, endsAt, capacity, input.pricePaise ?? 0, input.payoutUpi ?? null, access, code, iso)
      .run();
  } catch (e) {
    if (isUnique(e, "access_code")) throw new OrganizerError(409, "code_taken", "That code is taken. Try another.");
    throw e;
  }
  await audit(db, owner.id, "event_create", id, { slug, draft: true }, now);
  if (owner.role === "attendee") {
    const res = await db.prepare("UPDATE users SET role = 'organizer' WHERE id = ? AND role = 'attendee'").bind(owner.id).run();
    if (res.meta.changes) await audit(db, owner.id, "role_change", owner.id, { from: "attendee", to: "organizer", reason: "hosted_event", eventId: id }, now);
  }
  return { id, slug, version: 1, access_code: code };
}

const getRow = (db: D1Database, id: string) => db.prepare("SELECT * FROM events WHERE id = ?").bind(id).first<EventRow>();

/** Autosave and every other edit. Fields left out keep their current value. */
export async function saveEvent(db: D1Database, owner: Owner, id: string, version: number, input: EventFields, now = new Date()) {
  const cur = await getRow(db, id);
  if (!cur) throw new OrganizerError(404, "not_found", "Event not found.");

  const curStart = new Date(cur.starts_at);
  const curMinutes = Math.round((Date.parse(cur.ends_at) - curStart.getTime()) / 60_000);
  const startsAt = input.date || input.time ? istToIso(input.date ?? istDate(curStart), input.time ?? istTime(curStart)) : cur.starts_at;
  const endsAt = new Date(Date.parse(startsAt) + (input.durationMinutes ?? curMinutes) * 60_000).toISOString();

  const pick = <T,>(v: T | undefined, c: T) => (v === undefined ? c : v);
  const access = input.access ?? cur.access;
  const wantedCode = input.accessCode === undefined ? cur.access_code : input.accessCode ? normalizeCode(input.accessCode) : null;
  // Switching to Code without typing one yet: generate it, so the row is always valid.
  const code = access === "code" ? (wantedCode ?? newAccessCode()) : wantedCode;
  const next = {
    title: input.title ?? cur.title,
    slug: input.slug && input.slug !== cur.slug ? await freeSlug(db, input.slug, id) : cur.slug,
    tagline: pick(input.tagline, cur.tagline),
    description: pick(input.description, cur.description),
    category: pick(input.category, cur.category),
    venue: pick(input.venue, cur.venue),
    venueStatus: input.venueStatus ?? cur.venue_status,
    capacity: pick(input.capacity, cur.capacity),
    price: input.pricePaise ?? cur.price_paise,
    upi: pick(input.payoutUpi, cur.organizer_upi_id),
  };

  if (cur.status === "published") {
    const missing = missingForPublish({ ...cur, title: next.title, category: next.category, venue: next.venue, venue_status: next.venueStatus, description: next.description, price_paise: next.price, organizer_upi_id: next.upi, access, access_code: code });
    if (missing.length) throw new OrganizerError(422, "incomplete", "A published event needs these filled in.", { missing });
    const slotMoved = startsAt !== cur.starts_at || endsAt !== cur.ends_at || next.venue !== cur.venue;
    if (slotMoved && next.venue) {
      const hard = (await clashesFor(db, { id, venue: next.venue, startsAt, endsAt, category: next.category })).filter((c) => c.severity === "hard");
      if (hard.length) throw new OrganizerError(409, "venue_clash", `${hard[0].reason} Pick another time or venue.`);
    }
  }

  const iso = now.toISOString();
  const ownerClause = owner.role === "admin" ? "" : "AND organizer_id = ?18";
  let row: { version: number } | null;
  try {
    const stmt = db.prepare(
      `UPDATE events
          SET title=?2, slug=?3, tagline=?4, description=?5, category=?6, venue=?7, venue_status=?8, starts_at=?9, ends_at=?10, capacity=?11,
              price_paise=?12, organizer_upi_id=?13, access=?14, access_code=?15, updated_at=?16, version=version+1
        WHERE id=?1 AND version=?17 AND COALESCE(?11, 1e18) >= ${SEATS} ${ownerClause}
        RETURNING version`,
    );
    const args = [id, next.title, next.slug, next.tagline, next.description, next.category, next.venue, next.venueStatus, startsAt, endsAt, next.capacity, next.price, next.upi, access, code, iso, version];
    row = await (owner.role === "admin" ? stmt.bind(...args) : stmt.bind(...args, owner.id)).first<{ version: number }>();
  } catch (e) {
    if (isUnique(e, "access_code")) throw new OrganizerError(409, "code_taken", "That code is taken. Try another.");
    if (isUnique(e, "slug")) throw new OrganizerError(409, "slug_taken", "That link is taken. Try another.");
    throw e;
  }
  if (!row) {
    const now2 = await getRow(db, id);
    if (now2 && now2.version !== version) throw new OrganizerError(409, "version_conflict", "This event changed somewhere else. Reload to get the latest.", { version: now2.version });
    const taken = await db.prepare(`SELECT ${SEATS} AS n FROM events WHERE id = ?`).bind(id).first<{ n: number }>();
    if (next.capacity !== null && taken && next.capacity < taken.n) throw new OrganizerError(409, "capacity_below_registrations", `Capacity can't go below the ${taken.n} seats already taken.`);
    throw new OrganizerError(403, "forbidden", "You can only manage your own events.");
  }
  await audit(db, owner.id, "event_update", id, { fields: Object.keys(input), version: row.version }, now);
  if (next.price > 0 && next.upi && next.upi !== cur.organizer_upi_id) {
    await db.prepare("UPDATE users SET default_payout_upi = ? WHERE id = ?").bind(next.upi, owner.id).run();
  }
  return { version: row.version, slug: next.slug, access_code: code };
}

export async function clashesFor(db: D1Database, slot: { id?: string; venue: string | null; startsAt: string; endsAt: string; category: string | null }): Promise<Clash[]> {
  const DAY = 86_400_000;
  const rows = await db
    .prepare(`SELECT id, title, venue, starts_at, ends_at, category, capacity FROM events WHERE status = 'published' AND id != ? AND starts_at < ? AND ends_at > ?`)
    .bind(slot.id ?? "", new Date(Date.parse(slot.endsAt) + DAY).toISOString(), new Date(Date.parse(slot.startsAt) - DAY).toISOString())
    .all<{ id: string; title: string; venue: string | null; starts_at: string; ends_at: string; category: string | null; capacity: number | null }>();
  return detectClashes(
    { id: slot.id, venueId: slot.venue ?? "(no venue yet)", startsAt: new Date(slot.startsAt), endsAt: new Date(slot.endsAt), category: slot.category ?? "" },
    rows.results.map((r) => ({
      id: r.id,
      title: r.title,
      venueId: r.venue ?? `(no venue ${r.id})`,
      venueName: r.venue ?? "TBA",
      startsAt: new Date(r.starts_at),
      endsAt: new Date(r.ends_at),
      status: "PUBLISHED",
      category: r.category ?? "",
      capacity: r.capacity,
      bufferMinutes: r.venue ? bufferFor(r.venue) : 0,
    })),
  );
}

/** Returns the list of what's missing, never a generic error. */
export async function publishEvent(db: D1Database, owner: Owner, id: string, version: number, opts: { acknowledgeSoftClashes?: boolean } = {}, now = new Date()) {
  const cur = await getRow(db, id);
  if (!cur) throw new OrganizerError(404, "not_found", "Event not found.");
  const missing: PublishField[] = missingForPublish(cur);
  if (missing.length) throw new OrganizerError(422, "incomplete", "Fill these in to publish.", { missing });

  const online = cur.venue_status !== "confirmed";
  const clashes = (await clashesFor(db, { id, venue: online ? null : cur.venue, startsAt: cur.starts_at, endsAt: cur.ends_at, category: cur.category })).filter((c) => !(online && c.severity === "hard"));
  const hard = clashes.find((c) => c.severity === "hard");
  if (hard) throw new OrganizerError(409, "venue_clash", `${hard.reason} Pick another time or venue.`);
  const soft = clashes.find((c) => c.severity === "soft");
  if (soft && !opts.acknowledgeSoftClashes) throw new OrganizerError(409, "soft_clash", soft.reason);

  const iso = now.toISOString();
  const res = await db
    .prepare("UPDATE events SET status='published', published_at=?3, updated_at=?3, version=version+1 WHERE id=?1 AND version=?2 AND status='draft' RETURNING version, slug")
    .bind(id, version, iso)
    .first<{ version: number; slug: string }>();
  if (!res) throw new OrganizerError(409, "version_conflict", "This event changed somewhere else. Reload to get the latest.");
  await audit(db, owner.id, "event_publish", id, { version: res.version }, now);
  return res;
}

/** Back to draft. The join code is kept. Refused once people hold passes, so nobody's pass silently vanishes. */
export async function unpublishEvent(db: D1Database, owner: Owner, id: string, version: number, now = new Date()) {
  const held = await db.prepare("SELECT COUNT(*) AS n FROM registrations WHERE event_id = ? AND status IN ('registered','waitlisted')").bind(id).first<{ n: number }>();
  if (held && held.n > 0) throw new OrganizerError(409, "has_registrations", `${held.n} ${held.n === 1 ? "person holds a pass" : "people hold passes"}, so this can't go back to draft.`);
  const res = await db
    .prepare("UPDATE events SET status='draft', updated_at=?3, version=version+1 WHERE id=?1 AND version=?2 AND status='published' RETURNING version")
    .bind(id, version, now.toISOString())
    .first<{ version: number }>();
  if (!res) throw new OrganizerError(409, "version_conflict", "This event changed somewhere else. Reload to get the latest.");
  await audit(db, owner.id, "event_unpublish", id, { version: res.version }, now);
  return res;
}

/** A prefilled draft in one call. A join code is never copied: codes are unique. */
export async function duplicateEvent(db: D1Database, owner: Owner, id: string, now = new Date()) {
  const cur = await getRow(db, id);
  if (!cur) throw new OrganizerError(404, "not_found", "Event not found.");
  const newEventId = newId();
  const title = `${cur.title.slice(0, 53)} (copy)`;
  const slug = await freeSlug(db, title);
  const iso = now.toISOString();
  await db
    .prepare(
      `INSERT INTO events (id, slug, organizer_id, title, tagline, description, category, venue, venue_status, starts_at, ends_at, capacity, price_paise, organizer_upi_id,
                           access, access_code, status, version, created_at, updated_at, event_type, meeting_url, banner_url, drive_folder_url)
       SELECT ?1, ?2, ?3, ?4, tagline, description, category, venue, venue_status, starts_at, ends_at, capacity, price_paise, organizer_upi_id,
              'public', NULL, 'draft', 1, ?5, ?5, event_type, meeting_url, banner_url, NULL
         FROM events WHERE id = ?6`,
    )
    .bind(newEventId, slug, owner.id, title, iso, id)
    .run();
  await audit(db, owner.id, "event_create", newEventId, { slug, duplicateOf: id }, now);
  return { id: newEventId, slug, version: 1 };
}

export async function codeAvailable(db: D1Database, code: string, eventId?: string): Promise<boolean> {
  const row = await db.prepare("SELECT id FROM events WHERE access_code = ?").bind(normalizeCode(code)).first<{ id: string }>();
  return !row || row.id === eventId;
}

export const CODE_MISS_LIMIT = 20;

/** /c/:code lookup. Null means no such event; throws once an IP has guessed wrong too often. */
export async function resolveShortCode(db: D1Database, code: string, ip: string, now = new Date()): Promise<string | null> {
  const since = new Date(now.getTime() - 60_000).toISOString();
  const misses = (await db.prepare("SELECT COUNT(*) AS n FROM link_code_misses WHERE ip = ? AND at > ?").bind(ip, since).first<{ n: number }>())?.n ?? 0;
  if (misses >= CODE_MISS_LIMIT) throw new OrganizerError(429, "rate_limited", "Too many wrong codes. Wait a minute and try again.");
  const normal = normalizeCode(code);
  const row = await db.prepare("SELECT slug FROM events WHERE access_code = ? AND status IN ('published','closed')").bind(normal).first<{ slug: string }>();
  if (row) return `/events/${row.slug}?code=${encodeURIComponent(normal)}`;
  await db.batch([
    db.prepare("INSERT INTO link_code_misses (ip, at) VALUES (?, ?)").bind(ip, now.toISOString()),
    db.prepare("DELETE FROM link_code_misses WHERE at < ?").bind(new Date(now.getTime() - 3_600_000).toISOString()),
  ]);
  return null;
}

type WindowRow = { id: string; slug: string; title: string; category: string | null; venue: string | null; venue_status: string; starts_at: string; ends_at: string; status: string; price_paise: number; capacity: number | null; version: number; taken: number };

/** This organizer's events overlapping [from, to), plus a clash flag for each. */
export async function calendarWindow(db: D1Database, ownerId: string, from: string, to: string) {
  const rows = await db
    .prepare(
      `SELECT id, slug, title, category, venue, venue_status, starts_at, ends_at, status, price_paise, capacity, version, ${SEATS} AS taken
         FROM events WHERE organizer_id = ?1 AND status IN ('draft','published','closed') AND ends_at >= ?2 AND starts_at < ?3
        ORDER BY starts_at`,
    )
    .bind(ownerId, from, to)
    .all<WindowRow>();

  const clashes: { eventId: string; title: string; other: string; venue: string | null; severity: string }[] = [];
  const events: (CalendarEvent & { category: string | null; venue_status: string })[] = [];
  for (const r of rows.results) {
    const found = r.venue && r.venue_status === "confirmed" ? await clashesFor(db, { id: r.id, venue: r.venue, startsAt: r.starts_at, endsAt: r.ends_at, category: r.category }) : [];
    const hard = found.filter((c) => c.severity === "hard");
    for (const c of hard) clashes.push({ eventId: r.id, title: r.title, other: c.title, venue: r.venue, severity: c.severity });
    events.push({ ...r, clash: hard.length > 0 });
  }
  return { events, clashes };
}

export interface HomeEvent extends EventRow {
  taken: number;
}

export async function organizerEvents(db: D1Database, ownerId: string): Promise<HomeEvent[]> {
  const rows = await db.prepare(`SELECT events.*, ${SEATS} AS taken FROM events WHERE organizer_id = ? ORDER BY starts_at`).bind(ownerId).all<HomeEvent>();
  return rows.results;
}
