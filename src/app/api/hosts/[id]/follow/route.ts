import { ApiError, handle } from "@/lib/api";
import { first, getDB } from "@/lib/db";
import { requireUser } from "@/lib/rbac";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

async function count(hostId: string) {
  return (await first<{ n: number }>("SELECT COUNT(*) AS n FROM host_follows WHERE host_id = ?", hostId))?.n ?? 0;
}

/** POST — follow a host, so their new events show up for you. */
export const POST = handle(async (_req: Request, { params }: Ctx) => {
  const viewer = await requireUser();
  const { id } = await params;
  if (id === viewer.id) throw new ApiError(400, "self", "You can't follow yourself.");
  if (!(await first("SELECT id FROM users WHERE id = ?", id))) throw new ApiError(404, "not_found", "Host not found.");
  const db = await getDB();
  await db.prepare("INSERT OR IGNORE INTO host_follows (user_id, host_id, created_at) VALUES (?, ?, ?)").bind(viewer.id, id, new Date().toISOString()).run();
  return Response.json({ following: true, followers: await count(id) });
});

/** DELETE — unfollow. */
export const DELETE = handle(async (_req: Request, { params }: Ctx) => {
  const viewer = await requireUser();
  const { id } = await params;
  const db = await getDB();
  await db.prepare("DELETE FROM host_follows WHERE user_id = ? AND host_id = ?").bind(viewer.id, id).run();
  return Response.json({ following: false, followers: await count(id) });
});
