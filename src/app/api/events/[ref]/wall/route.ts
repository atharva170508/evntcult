import { z } from "zod";
import { ApiError, handle, parseBody } from "@/lib/api";
import { first, getDB } from "@/lib/db";
import { canManageEvent, getViewer, requireUser } from "@/lib/rbac";
import { newId } from "@/lib/tokens";
import { WALL_EMOJI } from "@/lib/effects";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ ref: string }> };


async function load(ref: string) {
  const e = await first<{ id: string; organizer_id: string }>(
    "SELECT id, organizer_id FROM events WHERE (slug = ? OR id = ?) AND status IN ('published','closed')",
    ref,
    ref,
  );
  if (!e) throw new ApiError(404, "not_found", "Event not found.");
  return e;
}

/** Guests (registered, approved or checked in) and the hosts can read and post. */
async function access(eventId: string, userId: string | undefined) {
  if (!userId) return { guest: false, host: false };
  const viewer = await getViewer();
  const host = !!viewer && (await canManageEvent(viewer, eventId));
  const reg = await first<{ n: number }>(
    "SELECT COUNT(*) AS n FROM registrations WHERE event_id = ? AND user_id = ? AND status IN ('registered','checked_in')",
    eventId,
    userId,
  );
  return { guest: host || (reg?.n ?? 0) > 0, host };
}

async function list(eventId: string, userId: string) {
  const db = await getDB();
  const posts = await db
    .prepare(
      `SELECT p.id, p.body, p.created_at, p.user_id, u.name,
              (p.user_id = (SELECT organizer_id FROM events WHERE id = p.event_id)) AS is_host
         FROM event_posts p JOIN users u ON u.id = p.user_id
        WHERE p.event_id = ? ORDER BY p.created_at DESC LIMIT 50`,
    )
    .bind(eventId)
    .all<{ id: string; body: string; created_at: string; user_id: string; name: string; is_host: number }>();
  const ids = (posts.results ?? []).map((p) => p.id);
  const reacts = ids.length
    ? await db
        .prepare(
          `SELECT post_id, emoji, COUNT(*) AS n, SUM(user_id = ?) AS mine FROM event_post_reactions
            WHERE post_id IN (${ids.map(() => "?").join(",")}) GROUP BY post_id, emoji`,
        )
        .bind(userId, ...ids)
        .all<{ post_id: string; emoji: string; n: number; mine: number }>()
    : { results: [] };
  return (posts.results ?? []).map((p) => ({
    id: p.id,
    body: p.body,
    at: p.created_at,
    name: p.name,
    mine: p.user_id === userId,
    host: !!p.is_host,
    reactions: Object.fromEntries(
      (reacts.results ?? []).filter((r) => r.post_id === p.id).map((r) => [r.emoji, { n: r.n, mine: !!r.mine }]),
    ),
  }));
}

/** GET — the wall, or { locked, count } for people who aren't guests. */
export const GET = handle(async (_req: Request, { params }: Ctx) => {
  const e = await load((await params).ref);
  const viewer = await getViewer();
  const a = await access(e.id, viewer?.id);
  if (!a.guest) {
    const c = await first<{ n: number }>("SELECT COUNT(*) AS n FROM event_posts WHERE event_id = ?", e.id);
    return Response.json({ locked: true, count: c?.n ?? 0 });
  }
  return Response.json({ locked: false, posts: await list(e.id, viewer!.id) });
});

const post = z.union([
  z.object({ body: z.string().trim().min(1).max(500) }).strict(),
  z.object({ react: z.string(), emoji: z.enum(WALL_EMOJI) }).strict(),
]);

/** POST { body } to post, or { react: postId, emoji } to toggle a reaction. */
export const POST = handle(async (req: Request, { params }: Ctx) => {
  const viewer = await requireUser();
  const e = await load((await params).ref);
  if (!(await access(e.id, viewer.id)).guest) throw new ApiError(403, "forbidden", "Only guests can post here.");
  const b = await parseBody(req, post);
  const db = await getDB();
  if ("body" in b) {
    const recent = await first<{ n: number }>(
      "SELECT COUNT(*) AS n FROM event_posts WHERE event_id = ? AND user_id = ? AND created_at > ?",
      e.id,
      viewer.id,
      new Date(Date.now() - 60_000).toISOString(),
    );
    if ((recent?.n ?? 0) >= 3) throw new ApiError(429, "slow_down", "Give it a minute before posting again.");
    await db
      .prepare("INSERT INTO event_posts (id, event_id, user_id, body, created_at) VALUES (?, ?, ?, ?, ?)")
      .bind(newId(), e.id, viewer.id, b.body, new Date().toISOString())
      .run();
  } else {
    const own = await first<{ id: string }>("SELECT id FROM event_posts WHERE id = ? AND event_id = ?", b.react, e.id);
    if (!own) throw new ApiError(404, "not_found", "That post is gone.");
    const del = await db
      .prepare("DELETE FROM event_post_reactions WHERE post_id = ? AND user_id = ? AND emoji = ?")
      .bind(b.react, viewer.id, b.emoji)
      .run();
    if (!del.meta.changes)
      await db.prepare("INSERT INTO event_post_reactions (post_id, user_id, emoji) VALUES (?, ?, ?)").bind(b.react, viewer.id, b.emoji).run();
  }
  return Response.json({ locked: false, posts: await list(e.id, viewer.id) });
});

/** DELETE ?id= — remove your own post (hosts can remove any). */
export const DELETE = handle(async (req: Request, { params }: Ctx) => {
  const viewer = await requireUser();
  const e = await load((await params).ref);
  const id = new URL(req.url).searchParams.get("id") ?? "";
  const a = await access(e.id, viewer.id);
  const p = await first<{ user_id: string }>("SELECT user_id FROM event_posts WHERE id = ? AND event_id = ?", id, e.id);
  if (!p) throw new ApiError(404, "not_found", "That post is gone.");
  if (p.user_id !== viewer.id && !a.host) throw new ApiError(403, "forbidden", "You can only remove your own posts.");
  const db = await getDB();
  await db.batch([
    db.prepare("DELETE FROM event_post_reactions WHERE post_id = ?").bind(id),
    db.prepare("DELETE FROM event_posts WHERE id = ?").bind(id),
  ]);
  return Response.json({ locked: false, posts: await list(e.id, viewer.id) });
});
