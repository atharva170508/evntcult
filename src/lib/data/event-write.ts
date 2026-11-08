import "server-only";
import { z } from "zod";
import { all, first, run } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { audit } from "@/lib/audit";
import { detectClashes, type Clash } from "@/lib/clash";
import { bufferFor } from "@/lib/venues";
import { newAccessCode, newId } from "@/lib/tokens";
import { istHm, istToUtcIso, istYmd, nowIso } from "@/lib/time";
import type { Viewer } from "@/lib/rbac";
import { parseDriveLink } from "@/lib/googleDrive";
import { UNLIMITED_CAPACITY, type HostEventInput, type createEventSchema, type patchEventSchema } from "@/lib/validation";
import type { EventRow } from "./types";

type CreateInput = z.infer<typeof createEventSchema>;
type PatchInput = z.infer<typeof patchEventSchema>;

function slugify(title: string) {
  return (
    title
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/[\s_]+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 60) || "event"
  );
}

async function uniqueSlug(title: string) {
  const base = slugify(title);
  if (!(await first("SELECT 1 FROM events WHERE slug = ?", base))) return base;
  for (;;) {
    const s = `${base}-${Math.random().toString(36).slice(2, 6)}`;
    if (!(await first("SELECT 1 FROM events WHERE slug = ?", s))) return s;
  }
}

/** Clashes of a slot against published events (hard = same venue incl. buffer, soft = same crowd). */
/** A TBA or online venue (null) can never double-book a room. */
export async function clashesFor(slot: { id?: string; venue: string | null; startsAt: string; endsAt: string; category: string | null }): Promise<Clash[]> {
  const DAY = 86_400_000;
  const rows = await all<{ id: string; title: string; venue: string | null; starts_at: string; ends_at: string; category: string | null; capacity: number | null }>(
    `SELECT id, title, venue, starts_at, ends_at, category, capacity FROM events
      WHERE status = 'published' AND id != ? AND starts_at < ? AND ends_at > ?`,
    slot.id ?? "",
    new Date(+new Date(slot.endsAt) + DAY).toISOString(),
    new Date(+new Date(slot.startsAt) - DAY).toISOString(),
  );
  return detectClashes(
    { id: slot.id, venueId: slot.venue ?? "(no venue yet)", startsAt: new Date(slot.startsAt), endsAt: new Date(slot.endsAt), category: slot.category ?? "" },
    rows.map((r) => ({
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

/** Throws 409 when publishing would double-book a venue, or a soft clash isn't acknowledged. */
function assertPublishable(clashes: Clash[], acknowledgeSoft: boolean) {
  const hard = clashes.filter((c) => c.severity === "hard");
  if (hard.length) throw new ApiError(409, "venue_clash", `${hard[0].reason} Pick another time or venue.`);
  const soft = clashes.filter((c) => c.severity === "soft");
  if (soft.length && !acknowledgeSoft) throw new ApiError(409, "soft_clash", `${soft[0].reason} Tick "publish anyway" to continue.`);
}

export async function createEvent(viewer: Viewer, input: CreateInput): Promise<EventRow> {
  const startsAt = istToUtcIso(input.date, input.startTime);
  const endsAt = istToUtcIso(input.date, input.endTime);
  if (input.publish) assertPublishable(await clashesFor({ venue: input.venue, startsAt, endsAt, category: input.category }), input.acknowledgeSoftClashes);

  const id = newId();
  const now = nowIso();
  const slug = await uniqueSlug(input.title);
  await run(
    `INSERT INTO events (id, slug, title, description, category, venue, starts_at, ends_at, capacity, price_paise, status, access, access_code, organizer_id, banner_key, created_at, updated_at, published_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?)`,
    id,
    slug,
    input.title,
    input.description ?? null,
    input.category,
    input.venue,
    startsAt,
    endsAt,
    input.capacity,
    input.pricePaise,
    input.publish ? "published" : "draft",
    input.access,
    input.access === "code" ? newAccessCode() : null,
    viewer.id,
    now,
    now,
    input.publish ? now : null,
  );
  await audit(viewer.id, "event_create", id, { slug, publish: input.publish });
  return (await first<EventRow>("SELECT * FROM events WHERE id = ?", id))!;
}

export async function updateEvent(viewer: Viewer, eventId: string, input: PatchInput): Promise<EventRow> {
  const cur = await first<EventRow>("SELECT * FROM events WHERE id = ?", eventId);
  if (!cur) throw new ApiError(404, "not_found", "Event not found.");

  const date = input.date ?? istYmd(new Date(cur.starts_at));
  const startsAt = input.date || input.startTime ? istToUtcIso(date, input.startTime ?? istHm(new Date(cur.starts_at))) : cur.starts_at;
  const endsAt = input.date || input.endTime ? istToUtcIso(date, input.endTime ?? istHm(new Date(cur.ends_at))) : cur.ends_at;
  if (endsAt <= startsAt) throw new ApiError(400, "invalid", "End time must be after start time.");

  const next = {
    title: input.title ?? cur.title,
    description: input.description ?? cur.description,
    category: input.category ?? cur.category,
    venue: input.venue ?? cur.venue,
    // The older full form can only send a number; its maximum means "no limit".
    capacity: input.capacity === UNLIMITED_CAPACITY ? null : (input.capacity ?? cur.capacity),
    price_paise: input.pricePaise ?? cur.price_paise,
    access: input.access ?? cur.access,
    status: input.status ?? cur.status,
  };

  const slotChanged = startsAt !== cur.starts_at || endsAt !== cur.ends_at || next.venue !== cur.venue || next.category !== cur.category;
  if (next.status === "published" && (cur.status !== "published" || slotChanged)) {
    assertPublishable(await clashesFor({ id: eventId, venue: next.venue, startsAt, endsAt, category: next.category }), input.acknowledgeSoftClashes);
  }

  // Capacity can't go below seats already taken — checked atomically in the UPDATE itself.
  const changed = await run(
    `UPDATE events SET title = ?, description = ?, category = ?, venue = ?, starts_at = ?, ends_at = ?, capacity = ?, price_paise = ?,
            access = ?, access_code = CASE WHEN ? = 'code' THEN COALESCE(access_code, ?) ELSE NULL END, status = ?,
            version = version + 1, updated_at = ?, published_at = CASE WHEN ? = 'published' THEN COALESCE(published_at, ?) ELSE published_at END
      WHERE id = ?
        AND COALESCE(?, 1e18) >= (SELECT COUNT(*) FROM registrations WHERE event_id = ? AND status IN ('registered','waitlisted'))`,
    next.title,
    next.description,
    next.category,
    next.venue,
    startsAt,
    endsAt,
    next.capacity,
    next.price_paise,
    next.access,
    next.access,
    newAccessCode(),
    next.status,
    nowIso(),
    next.status,
    nowIso(),
    eventId,
    next.capacity,
    eventId,
  );
  if (changed === 0) {
    const taken = await first<{ n: number }>(
      "SELECT COUNT(*) AS n FROM registrations WHERE event_id = ? AND status IN ('registered','waitlisted')",
      eventId,
    );
    throw new ApiError(409, "capacity_below_registrations", `Capacity can't go below the ${taken?.n ?? 0} seats already taken.`);
  }

  if (next.capacity !== cur.capacity) await audit(viewer.id, "capacity_change", eventId, { from: cur.capacity, to: next.capacity });
  await audit(viewer.id, "event_update", eventId, { fields: Object.keys(input).filter((k) => k !== "acknowledgeSoftClashes") });
  return (await first<EventRow>("SELECT * FROM events WHERE id = ?", eventId))!;
}

/** Venue used for virtual events. Two online events never "double-book" a room. */
export const ONLINE_VENUE = "Online";

/**
 * "Host an Event" modal: one screen, published straight away.
 * Same rules as the full form (organizers only, unique slug, venue clash checks, IST times),
 * plus the new fields from migration 0008.
 */
export async function createHostedEvent(viewer: Viewer, input: HostEventInput): Promise<EventRow> {
  const startsAt = istToUtcIso(input.date, input.time);
  if (new Date(startsAt) <= new Date()) throw new ApiError(400, "invalid", "Pick a date and time in the future.");
  const endsAt = new Date(+new Date(startsAt) + input.durationMinutes * 60_000).toISOString();

  const virtual = input.eventType === "virtual";
  const venue = virtual ? ONLINE_VENUE : input.location;

  let drive: string | null = null;
  if (input.driveFolderUrl) {
    const link = parseDriveLink(input.driveFolderUrl);
    if (!link.ok || link.kind !== "folder")
      throw new ApiError(400, "invalid_drive_link", "That isn't a Google Drive folder link. Open the folder in Drive and copy its link (…/drive/folders/…).");
    drive = `https://drive.google.com/drive/folders/${link.id}`;
  }

  // Online events can't clash on a room; they can still clash on the crowd (same category, same time).
  const clashes = (await clashesFor({ venue, startsAt, endsAt, category: input.category })).filter((c) => !(virtual && c.severity === "hard"));
  assertPublishable(clashes, input.acknowledgeSoftClashes);

  const id = newId();
  const slug = await uniqueSlug(input.title);
  await run(
    `INSERT INTO events (id, slug, title, description, category, venue, starts_at, ends_at, capacity, price_paise, status, access, access_code,
                         organizer_id, banner_key, created_at, event_type, meeting_url, tagline, organizer_upi_id, drive_folder_url, banner_url,
                         venue_status, updated_at, published_at)
     VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, 'published', 'public', NULL, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    slug,
    input.title,
    input.category,
    venue,
    startsAt,
    endsAt,
    input.capacity,
    input.isFree ? 0 : Math.round((input.ticketPrice ?? 0) * 100),
    viewer.id,
    nowIso(),
    input.eventType,
    virtual ? input.location : null,
    input.tagline || null,
    input.isFree ? null : (input.upiId ?? null),
    drive,
    input.bannerUrl ?? null,
    virtual ? "online" : "confirmed",
    nowIso(),
    nowIso(),
  );
  await audit(viewer.id, "event_create", id, { slug, publish: true, via: "host_modal" });
  return (await first<EventRow>("SELECT * FROM events WHERE id = ?", id))!;
}
