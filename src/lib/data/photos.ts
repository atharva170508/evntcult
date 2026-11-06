/**
 * Photo Vault: organizers upload event photos to R2; attendees tap "That's me" to tag themselves.
 * No face data is stored or computed anywhere (face matching is a Planned card).
 *
 * Who can see an event's photos: its organizer, admins, and people REGISTERED for it
 * (status 'registered', checked in or not). Waitlisted, cancelled and everyone else: no.
 *
 * Takes D1 and the R2 bucket as arguments (no "server-only"), so the tests can call it.
 */
import { newId } from "@/lib/tokens";

export const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
export const MAX_THUMB_BYTES = 1024 * 1024;
export type ImageType = "image/jpeg" | "image/png" | "image/webp";
const EXT: Record<ImageType, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export class PhotoError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

/** The real type from the file's first bytes. The browser's Content-Type label is never trusted. */
export function sniffImageType(bytes: Uint8Array): ImageType | null {
  const b = bytes;
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((v, i) => b[i] === v)) return "image/png";
  if (b.length >= 12 && String.fromCharCode(...b.slice(0, 4)) === "RIFF" && String.fromCharCode(...b.slice(8, 12)) === "WEBP") return "image/webp";
  return null;
}

interface Who {
  id: string;
  role: string;
}

/** Can this person see (and, if registered, tag) photos of this event? */
export async function photoAccess(db: D1Database, who: Who | null, eventId: string): Promise<{ view: boolean; manage: boolean; tag: boolean }> {
  const none = { view: false, manage: false, tag: false };
  if (!who) return none;
  const row = await db
    .prepare(
      `SELECT e.organizer_id,
              EXISTS (SELECT 1 FROM registrations r WHERE r.event_id = e.id AND r.user_id = ? AND r.status = 'registered') AS registered
         FROM events e WHERE e.id = ?`,
    )
    .bind(who.id, eventId)
    .first<{ organizer_id: string; registered: number }>();
  if (!row) return none;
  const manage = who.role === "admin" || (who.role === "organizer" && row.organizer_id === who.id);
  const tag = row.registered === 1;
  return { view: manage || tag, manage, tag };
}

async function audit(db: D1Database, actorId: string, action: string, targetId: string, meta: Record<string, unknown>, now: Date) {
  await db
    .prepare("INSERT INTO audit_log (id, actor_id, action, target_id, meta, created_at) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(newId(), actorId, action, targetId, JSON.stringify(meta), now.toISOString())
    .run();
}

export interface UploadInput {
  eventId: string;
  uploaderId: string;
  full: Uint8Array;
  thumb?: Uint8Array | null;
  width?: number | null;
  height?: number | null;
}

/** Store one photo (and its thumbnail) in R2 and record it. The caller has checked the uploader manages the event. */
export async function savePhoto(db: D1Database, bucket: R2Bucket, input: UploadInput, now = new Date()) {
  if (input.full.byteLength === 0) throw new PhotoError(400, "empty", "That file is empty.");
  if (input.full.byteLength > MAX_PHOTO_BYTES) throw new PhotoError(413, "too_large", "Photos can be at most 10 MB.");
  const type = sniffImageType(input.full);
  if (!type) throw new PhotoError(415, "not_an_image", "Only JPEG, PNG or WebP photos can be uploaded.");

  let thumbType: ImageType | null = null;
  if (input.thumb) {
    if (input.thumb.byteLength > MAX_THUMB_BYTES) throw new PhotoError(413, "thumb_too_large", "Thumbnail too large.");
    thumbType = sniffImageType(input.thumb);
    if (!thumbType) throw new PhotoError(415, "not_an_image", "The thumbnail isn't an image.");
  }
  const dim = (n?: number | null) => (n && Number.isInteger(n) && n > 0 && n <= 20000 ? n : null);

  const id = newId();
  const key = `events/${input.eventId}/${id}.${EXT[type]}`;
  const thumbKey = thumbType ? `events/${input.eventId}/${id}.thumb.${EXT[thumbType]}` : null;
  await bucket.put(key, input.full, { httpMetadata: { contentType: type } });
  if (thumbKey && input.thumb) await bucket.put(thumbKey, input.thumb, { httpMetadata: { contentType: thumbType! } });

  try {
    await db
      .prepare(
        `INSERT INTO photos (id, event_id, r2_key, uploaded_by, created_at, thumb_key, content_type, width, height, size_bytes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(id, input.eventId, key, input.uploaderId, now.toISOString(), thumbKey, type, dim(input.width), dim(input.height), input.full.byteLength)
      .run();
  } catch (err) {
    await bucket.delete([key, ...(thumbKey ? [thumbKey] : [])]); // don't leave orphan files
    throw err;
  }
  await audit(db, input.uploaderId, "photo_upload", id, { event_id: input.eventId, bytes: input.full.byteLength }, now);
  return { id, key, thumbKey, contentType: type };
}

export interface PhotoRow {
  id: string;
  event_id: string;
  r2_key: string;
  thumb_key: string | null;
  content_type: string | null;
  width: number | null;
  height: number | null;
  created_at: string;
}

export async function getPhoto(db: D1Database, id: string): Promise<PhotoRow | null> {
  return (await db.prepare("SELECT id, event_id, r2_key, thumb_key, content_type, width, height, created_at FROM photos WHERE id = ?").bind(id).first<PhotoRow>()) ?? null;
}

/** Remove a photo, its tags and its files. The caller has checked the user manages the event. */
export async function deletePhoto(db: D1Database, bucket: R2Bucket, id: string, actorId: string, now = new Date()) {
  const photo = await getPhoto(db, id);
  if (!photo) throw new PhotoError(404, "not_found", "Photo not found.");
  await db.batch([db.prepare("DELETE FROM photo_tags WHERE photo_id = ?").bind(id), db.prepare("DELETE FROM photos WHERE id = ?").bind(id)]);
  await bucket.delete([photo.r2_key, ...(photo.thumb_key ? [photo.thumb_key] : [])]);
  await audit(db, actorId, "photo_delete", id, { event_id: photo.event_id }, now);
}

/** "That's me" on / off. Only people registered for the photo's event can tag themselves. */
export async function setTag(db: D1Database, photoId: string, who: Who, on: boolean, now = new Date()) {
  const photo = await getPhoto(db, photoId);
  if (!photo) throw new PhotoError(404, "not_found", "Photo not found.");
  const access = await photoAccess(db, who, photo.event_id);
  if (!access.view) throw new PhotoError(404, "not_found", "Photo not found.");
  if (!access.tag) throw new PhotoError(403, "not_attendee", "Only people registered for this event can tag themselves.");
  if (on) {
    await db.prepare("INSERT INTO photo_tags (photo_id, user_id, created_at) VALUES (?, ?, ?) ON CONFLICT DO NOTHING").bind(photoId, who.id, now.toISOString()).run();
  } else {
    await db.prepare("DELETE FROM photo_tags WHERE photo_id = ? AND user_id = ?").bind(photoId, who.id).run();
  }
  return { tagged: on };
}

export interface GalleryPhoto {
  id: string;
  width: number | null;
  height: number | null;
  created_at: string;
  mine: number; // 1 if I tagged myself
}

export async function eventPhotos(db: D1Database, eventId: string, userId: string): Promise<GalleryPhoto[]> {
  const res = await db
    .prepare(
      `SELECT p.id, p.width, p.height, p.created_at,
              EXISTS (SELECT 1 FROM photo_tags t WHERE t.photo_id = p.id AND t.user_id = ?) AS mine
         FROM photos p WHERE p.event_id = ? ORDER BY p.created_at DESC, p.id`,
    )
    .bind(userId, eventId)
    .all<GalleryPhoto>();
  return res.results ?? [];
}

export interface VaultPhoto {
  id: string;
  width: number | null;
  height: number | null;
  event_id: string;
  event_slug: string;
  event_title: string;
  starts_at: string;
}

/** Photos I've tagged myself in, newest event first. Only from events I'm still registered for. */
export async function myTaggedPhotos(db: D1Database, userId: string): Promise<VaultPhoto[]> {
  const res = await db
    .prepare(
      `SELECT p.id, p.width, p.height, e.id AS event_id, e.slug AS event_slug, e.title AS event_title, e.starts_at
         FROM photo_tags t JOIN photos p ON p.id = t.photo_id JOIN events e ON e.id = p.event_id
        WHERE t.user_id = ?1
          AND EXISTS (SELECT 1 FROM registrations r WHERE r.event_id = e.id AND r.user_id = ?1 AND r.status = 'registered')
        ORDER BY e.starts_at DESC, t.created_at DESC`,
    )
    .bind(userId)
    .all<VaultPhoto>();
  return res.results ?? [];
}

/** My events that have photos, with how many there are and how many I'm tagged in. */
export async function myGalleries(db: D1Database, userId: string) {
  const res = await db
    .prepare(
      `SELECT e.id, e.slug, e.title, e.starts_at,
              (SELECT COUNT(*) FROM photos p WHERE p.event_id = e.id) AS photos,
              (SELECT COUNT(*) FROM photo_tags t JOIN photos p ON p.id = t.photo_id WHERE p.event_id = e.id AND t.user_id = ?1) AS mine
         FROM events e
        WHERE EXISTS (SELECT 1 FROM registrations r WHERE r.event_id = e.id AND r.user_id = ?1 AND r.status = 'registered')
          AND EXISTS (SELECT 1 FROM photos p WHERE p.event_id = e.id)
        ORDER BY e.starts_at DESC`,
    )
    .bind(userId)
    .all<{ id: string; slug: string; title: string; starts_at: string; photos: number; mine: number }>();
  return res.results ?? [];
}
