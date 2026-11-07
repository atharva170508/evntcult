/**
 * AI Face Search (M11): match a selfie embedding against an event's photos in Supabase.
 * The selfie itself never reaches us: the browser sends only the 128 numbers.
 * Takes D1 / config as arguments (no "server-only") so tests can call it directly.
 */
import { newId } from "@/lib/tokens";
import { toPgVector } from "@/lib/face/embedding";
import { driveDownloadUrl, driveThumbnailUrl } from "@/lib/googleDrive";
import { supabaseRpc, type SupabaseConfig } from "@/lib/supabase-rest";

/** Default cosine threshold (see supabase/migrations). Override with FACE_MATCH_THRESHOLD. */
export const DEFAULT_THRESHOLD = 0.93;
export const MAX_RESULTS = 60;
export const LIMITS = { perMinute: 6, perHour: 40 } as const;

export function matchThreshold(env: Record<string, string | undefined> = process.env as Record<string, string | undefined>): number {
  const t = Number(env.FACE_MATCH_THRESHOLD);
  return Number.isFinite(t) && t >= 0.5 && t < 1 ? t : DEFAULT_THRESHOLD;
}

export class FaceSearchError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public retryAfterSec?: number,
  ) {
    super(message);
  }
}

/** Counts and records one search. Throws 429 past 6 a minute or 40 an hour (stops scraping by guessing faces). */
export async function takeSearchSlot(db: D1Database, userId: string, eventId: string, now: Date = new Date()) {
  const row = await db
    .prepare(
      `SELECT SUM(created_at > ?2) AS minute, COUNT(*) AS hour
         FROM face_search_log WHERE user_id = ?1 AND created_at > ?3`,
    )
    .bind(userId, new Date(now.getTime() - 60_000).toISOString(), new Date(now.getTime() - 3_600_000).toISOString())
    .first<{ minute: number | null; hour: number }>();
  if ((row?.minute ?? 0) >= LIMITS.perMinute) throw new FaceSearchError(429, "rate_limited", "Too many searches. Wait a minute and try again.", 60);
  if ((row?.hour ?? 0) >= LIMITS.perHour) throw new FaceSearchError(429, "rate_limited", "You've searched a lot this hour. Try again later.", 3600);
  await db.prepare("INSERT INTO face_search_log (id, user_id, event_id, created_at) VALUES (?, ?, ?, ?)").bind(newId(), userId, eventId, now.toISOString()).run();
}

export async function purgeFaceSearchLog(db: D1Database, now: Date = new Date()) {
  await db.prepare("DELETE FROM face_search_log WHERE created_at < ?").bind(new Date(now.getTime() - 86_400_000).toISOString()).run();
}

export interface PhotoMatch {
  photoId: string;
  driveFileId: string;
  thumbnailUrl: string;
  /** Drive's own thumbnail, used if ours fails to load. */
  fallbackThumbnailUrl: string;
  downloadUrl: string;
  similarity: number;
}

type RpcRow = { photo_id: string; event_id: string; thumbnail_url: string; drive_file_id: string; similarity: number };

/** Ask Supabase for this event's photos that contain the face. */
export async function findMatches(cfg: SupabaseConfig, opts: { eventId: string; embedding: number[]; threshold: number }): Promise<PhotoMatch[]> {
  const rows = await supabaseRpc<RpcRow[]>(cfg, "match_attendee_photos", {
    query_embedding: toPgVector(opts.embedding),
    match_threshold: opts.threshold,
    match_count: MAX_RESULTS,
    filter_event_id: opts.eventId,
  });
  return rows
    .filter((r) => r.event_id === opts.eventId) // belt and braces: never leak another event's photos
    .map((r) => ({
      photoId: r.photo_id,
      driveFileId: r.drive_file_id,
      thumbnailUrl: /^https:\/\//.test(r.thumbnail_url) ? r.thumbnail_url : driveThumbnailUrl(r.drive_file_id),
      fallbackThumbnailUrl: driveThumbnailUrl(r.drive_file_id),
      downloadUrl: driveDownloadUrl(r.drive_file_id),
      similarity: r.similarity,
    }));
}
