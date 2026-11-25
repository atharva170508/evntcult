import { z } from "zod";
import { moderated } from "@/lib/moderation/zod";
import { ApiError, handle, parseBody } from "@/lib/api";
import { first, getDB } from "@/lib/db";
import { requireUser } from "@/lib/rbac";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ ref: string }> };

const body = z.object({ rating: z.number().int().min(1).max(5), comment: z.string().trim().max(600).superRefine(moderated("Comment")).optional() }).strict();

/** POST — rate an event you registered for, once it has started. Sending again updates your answer. */
export const POST = handle(async (req: Request, { params }: Ctx) => {
  const viewer = await requireUser();
  const { ref } = await params;
  const e = await first<{ id: string; starts_at: string }>("SELECT id, starts_at FROM events WHERE slug = ? OR id = ?", ref, ref);
  if (!e) throw new ApiError(404, "not_found", "Event not found.");
  if (Date.parse(e.starts_at) > Date.now()) throw new ApiError(400, "too_early", "You can rate it once it has started.");
  const reg = await first("SELECT id FROM registrations WHERE event_id = ? AND user_id = ? AND status = 'registered'", e.id, viewer.id);
  if (!reg) throw new ApiError(403, "not_guest", "Only people who registered can rate this event.");
  const b = await parseBody(req, body);
  const db = await getDB();
  await db
    .prepare(
      `INSERT INTO event_feedback (event_id, user_id, rating, comment, created_at) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(event_id, user_id) DO UPDATE SET rating = excluded.rating, comment = COALESCE(excluded.comment, event_feedback.comment), created_at = excluded.created_at`,
    )
    .bind(e.id, viewer.id, b.rating, b.comment || null, new Date().toISOString())
    .run();
  return Response.json({ ok: true });
});
