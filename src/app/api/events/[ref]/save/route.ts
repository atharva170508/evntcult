import { ApiError, handle } from "@/lib/api";
import { first, getDB } from "@/lib/db";
import { requireUser } from "@/lib/rbac";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ ref: string }> };

async function eventId(ref: string) {
  const e = await first<{ id: string }>("SELECT id FROM events WHERE (slug = ? OR id = ?) AND status IN ('published','closed')", ref, ref);
  if (!e) throw new ApiError(404, "not_found", "Event not found.");
  return e.id;
}

async function countFor(id: string) {
  return (await first<{ n: number }>("SELECT COUNT(*) AS n FROM event_saves WHERE event_id = ?", id))?.n ?? 0;
}

/** POST /api/events/:slug/save — mark an event as Interested. */
export const POST = handle(async (_req: Request, { params }: Ctx) => {
  const viewer = await requireUser();
  const id = await eventId((await params).ref);
  const db = await getDB();
  await db.prepare("INSERT OR IGNORE INTO event_saves (user_id, event_id, created_at) VALUES (?, ?, ?)").bind(viewer.id, id, new Date().toISOString()).run();
  return Response.json({ saved: true, count: await countFor(id) });
});

/** DELETE /api/events/:slug/save — not interested any more. */
export const DELETE = handle(async (_req: Request, { params }: Ctx) => {
  const viewer = await requireUser();
  const id = await eventId((await params).ref);
  const db = await getDB();
  await db.prepare("DELETE FROM event_saves WHERE user_id = ? AND event_id = ?").bind(viewer.id, id).run();
  return Response.json({ saved: false, count: await countFor(id) });
});
