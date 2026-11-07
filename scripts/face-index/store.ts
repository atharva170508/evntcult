/** Supabase writes for the album importer (service_role key; plain fetch via src/lib/supabase-rest). */
import { supabaseFetch, type SupabaseConfig } from "../../src/lib/supabase-rest";
import { toPgVector } from "../../src/lib/face/embedding";

export const THUMB_BUCKET = "event-thumbs";

/** Drive file IDs already indexed for this event (so re-runs only do new photos). */
export async function indexedFileIds(cfg: SupabaseConfig, eventId: string): Promise<Set<string>> {
  const ids = new Set<string>();
  for (let from = 0; ; from += 1000) {
    const res = await supabaseFetch(cfg, `/rest/v1/event_photos?select=drive_file_id&event_id=eq.${encodeURIComponent(eventId)}&order=drive_file_id`, {
      headers: { Range: `${from}-${from + 999}`, "Range-Unit": "items" },
    });
    const rows = (await res.json()) as { drive_file_id: string }[];
    rows.forEach((r) => ids.add(r.drive_file_id));
    if (rows.length < 1000) return ids;
  }
}

/** Upload (or replace) a thumbnail in the public bucket and return its public URL. */
export async function uploadThumbnail(cfg: SupabaseConfig, eventId: string, fileId: string, jpegBytes: Uint8Array): Promise<string> {
  const objectPath = `${encodeURIComponent(eventId)}/${encodeURIComponent(fileId)}.jpg`;
  await supabaseFetch(cfg, `/storage/v1/object/${THUMB_BUCKET}/${objectPath}`, {
    method: "POST",
    headers: { "Content-Type": "image/jpeg", "x-upsert": "true", "Cache-Control": "max-age=31536000" },
    body: new Blob([jpegBytes as Uint8Array<ArrayBuffer>], { type: "image/jpeg" }),
    timeoutMs: 30_000,
  });
  return `${cfg.url}/storage/v1/object/public/${THUMB_BUCKET}/${objectPath}`;
}

/** Insert or update the photo row, then replace its faces. Returns the photo id. */
export async function savePhotoFaces(
  cfg: SupabaseConfig,
  row: { eventId: string; driveFileId: string; thumbnailUrl: string },
  faces: number[][],
): Promise<string> {
  const res = await supabaseFetch(cfg, "/rest/v1/event_photos?on_conflict=drive_file_id", {
    method: "POST",
    headers: { "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify({ event_id: row.eventId, drive_file_id: row.driveFileId, thumbnail_url: row.thumbnailUrl }),
  });
  const [photo] = (await res.json()) as { id: string }[];
  await supabaseFetch(cfg, `/rest/v1/photo_faces?photo_id=eq.${photo.id}`, { method: "DELETE" });
  if (faces.length > 0) {
    await supabaseFetch(cfg, "/rest/v1/photo_faces", {
      method: "POST",
      headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify(faces.map((v) => ({ photo_id: photo.id, event_id: row.eventId, embedding: toPgVector(v) }))),
    });
  }
  return photo.id;
}
