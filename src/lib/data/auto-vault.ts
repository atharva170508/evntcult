import { newId } from "@/lib/tokens";
import { normalizeEmbedding } from "@/lib/face/embedding";
import { findMatches, matchThreshold } from "@/lib/data/face-search";
import { supabaseConfig } from "@/lib/supabase-rest";

export interface AutoVaultPhoto {
  id: string;
  eventId: string;
  eventSlug: string;
  eventTitle: string;
  startsAt: string;
  photoId: string;
  driveFileId: string | null;
  thumbnailUrl: string;
  downloadUrl: string;
  similarity: number;
}

/**
 * Save or update a user's 1-time Face ID descriptor in the database.
 * The photo itself is never uploaded: only the 128 normalized float numbers are stored.
 */
export async function saveUserFaceId(
  db: D1Database,
  userId: string,
  embedding: number[],
  now = new Date(),
) {
  const normalized = normalizeEmbedding(embedding);
  if (!normalized) throw new Error("Invalid face embedding vector");
  const json = JSON.stringify(normalized);
  const nowStr = now.toISOString();

  await db
    .prepare("UPDATE users SET face_embedding = ?, face_updated_at = ? WHERE id = ?")
    .bind(json, nowStr, userId)
    .run();

  // Run immediate auto-sync across their registered events
  const syncResult = await syncUserAutoVault(db, userId).catch((err) => {
    console.error("[auto-vault] initial sync warning:", err);
    return { syncedEvents: 0, matchedPhotos: 0 };
  });

  return { ok: true, faceUpdatedAt: nowStr, ...syncResult };
}

/** Remove a user's Face ID descriptor and optionally clear auto-matched photos. */
export async function deleteUserFaceId(db: D1Database, userId: string) {
  await db
    .prepare("UPDATE users SET face_embedding = NULL, face_updated_at = NULL WHERE id = ?")
    .bind(userId)
    .run();
  return { ok: true };
}

/**
 * Check if the user has a stored Face ID descriptor.
 */
export async function getUserFaceId(db: D1Database, userId: string) {
  const row = await db
    .prepare("SELECT face_embedding, face_updated_at FROM users WHERE id = ?")
    .bind(userId)
    .first<{ face_embedding: string | null; face_updated_at: string | null }>();

  if (!row?.face_embedding) return { enrolled: false, updatedAt: null, embedding: null };

  try {
    const raw = JSON.parse(row.face_embedding);
    const embedding = normalizeEmbedding(raw);
    return {
      enrolled: Boolean(embedding),
      updatedAt: row.face_updated_at,
      embedding,
    };
  } catch {
    return { enrolled: false, updatedAt: null, embedding: null };
  }
}

/**
 * Automatically find and tag all photos of the user across all events they are registered for.
 */
export async function syncUserAutoVault(
  db: D1Database,
  userId: string,
  now = new Date(),
): Promise<{ syncedEvents: number; matchedPhotos: number }> {
  const face = await getUserFaceId(db, userId);
  if (!face.enrolled || !face.embedding) return { syncedEvents: 0, matchedPhotos: 0 };

  const cfg = supabaseConfig();
  if (!cfg) return { syncedEvents: 0, matchedPhotos: 0 };

  // Find all published events the user is registered for
  const registeredEvents = await db
    .prepare(
      `SELECT e.id, e.slug, e.title
         FROM events e
         JOIN registrations r ON r.event_id = e.id
        WHERE r.user_id = ? AND r.status = 'registered' AND e.status = 'published'`,
    )
    .bind(userId)
    .all<{ id: string; slug: string; title: string }>();

  const events = registeredEvents.results ?? [];
  if (events.length === 0) return { syncedEvents: 0, matchedPhotos: 0 };

  let totalMatched = 0;
  const threshold = matchThreshold();

  for (const ev of events) {
    try {
      const matches = await findMatches(cfg, {
        eventId: ev.id,
        embedding: face.embedding,
        threshold,
      });

      if (matches.length > 0) {
        totalMatched += matches.length;
        const nowStr = now.toISOString();

        for (const m of matches) {
          const id = newId();
          await db
            .prepare(
              `INSERT INTO auto_photo_matches (id, user_id, event_id, photo_id, drive_file_id, thumbnail_url, download_url, similarity, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
               ON CONFLICT(user_id, photo_id) DO UPDATE SET
                 thumbnail_url = excluded.thumbnail_url,
                 download_url = excluded.download_url,
                 similarity = excluded.similarity`,
            )
            .bind(
              id,
              userId,
              ev.id,
              m.photoId,
              m.driveFileId,
              m.thumbnailUrl,
              m.downloadUrl,
              m.similarity,
              nowStr,
            )
            .run();

          // If this photo also exists in Cloudflare D1 photos table, auto-tag it!
          await db
            .prepare(
              "INSERT OR IGNORE INTO photo_tags (photo_id, user_id, created_at) VALUES (?, ?, ?)",
            )
            .bind(m.photoId, userId, nowStr)
            .run()
            .catch(() => {});
        }
      }
    } catch (err) {
      console.error(`[auto-vault] error syncing event ${ev.id}:`, err);
    }
  }

  return { syncedEvents: events.length, matchedPhotos: totalMatched };
}

/**
 * Retrieve all auto-matched photos for a user across their registered events.
 */
export async function myAutoMatchedPhotos(
  db: D1Database,
  userId: string,
): Promise<AutoVaultPhoto[]> {
  const rows = await db
    .prepare(
      `SELECT m.id, m.event_id, e.slug AS event_slug, e.title AS event_title, e.starts_at,
              m.photo_id, m.drive_file_id, m.thumbnail_url, m.download_url, m.similarity
         FROM auto_photo_matches m
         JOIN events e ON e.id = m.event_id
        WHERE m.user_id = ?1
          AND EXISTS (SELECT 1 FROM registrations r WHERE r.event_id = e.id AND r.user_id = ?1 AND r.status = 'registered')
        ORDER BY e.starts_at DESC, m.similarity DESC`,
    )
    .bind(userId)
    .all<{
      id: string;
      event_id: string;
      event_slug: string;
      event_title: string;
      starts_at: string;
      photo_id: string;
      drive_file_id: string | null;
      thumbnail_url: string;
      download_url: string;
      similarity: number;
    }>();

  return (rows.results ?? []).map((r) => ({
    id: r.id,
    eventId: r.event_id,
    eventSlug: r.event_slug,
    eventTitle: r.event_title,
    startsAt: r.starts_at,
    photoId: r.photo_id,
    driveFileId: r.drive_file_id,
    thumbnailUrl: r.thumbnail_url,
    downloadUrl: r.download_url,
    similarity: r.similarity,
  }));
}
