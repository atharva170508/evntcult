import { z } from "zod";
import { ApiError, handle, parseBody } from "@/lib/api";
import { requireUser } from "@/lib/rbac";
import { first, getDB } from "@/lib/db";
import { photoAccess } from "@/lib/data/photos";
import { FaceSearchError, findMatches, matchThreshold, takeSearchSlot } from "@/lib/data/face-search";
import { EMBEDDING_DIM, normalizeEmbedding } from "@/lib/face/embedding";
import { SupabaseError, supabaseConfig } from "@/lib/supabase-rest";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ ref: string }> };

const body = z.object({ embedding: z.array(z.number().finite()).length(EMBEDDING_DIM) }).strict();

/**
 * POST /api/events/:id/face-match  { embedding: number[128] }
 * The browser turns the selfie into 128 numbers and sends only those; the photo never leaves
 * the phone. Returns this event's photos that contain the face, best match first.
 * Same people as the gallery: registered attendees, the organizer and admins.
 * Nothing about the search is stored except a timestamp for the rate limit.
 */
export const POST = handle(async (req: Request, { params }: Ctx) => {
  const { ref } = await params;
  const viewer = await requireUser();
  const cfg = supabaseConfig();
  if (!cfg) throw new ApiError(503, "face_search_off", "AI Face Search isn't switched on yet.");

  const event = await first<{ id: string; status: string }>("SELECT id, status FROM events WHERE id = ? OR slug = ?", ref, ref);
  if (!event || event.status === "draft") throw new ApiError(404, "not_found", "Event not found.");
  const db = await getDB();
  if (!(await photoAccess(db, viewer, event.id)).view) throw new ApiError(403, "forbidden", "Only this event's attendees can search its photos.");

  const { embedding: raw } = await parseBody(req, body);
  const embedding = normalizeEmbedding(raw);
  if (!embedding) throw new ApiError(400, "bad_embedding", "That selfie couldn't be read. Try another one.");

  try {
    await takeSearchSlot(db, viewer.id, event.id);
    const matches = await findMatches(cfg, { eventId: event.id, embedding, threshold: matchThreshold() });
    return Response.json({ matches }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    if (e instanceof FaceSearchError) {
      const res = Response.json({ error: { code: e.code, message: e.message } }, { status: e.status });
      if (e.retryAfterSec) res.headers.set("Retry-After", String(e.retryAfterSec));
      return res;
    }
    if (e instanceof SupabaseError) {
      console.error(`[face-match] supabase ${e.status}: ${e.message}`);
      // Free Supabase projects pause when idle; the first request after that fails for a bit.
      throw new ApiError(503, "face_search_unavailable", "Face search is waking up. Try again in a minute.");
    }
    throw e;
  }
});
