import { z } from "zod";
import { getDB } from "@/lib/db";
import { getViewer } from "@/lib/rbac";
import { findCategoryHub, findCity } from "@/lib/discovery";
import { nowIso } from "@/lib/time";

const schema = z.object({
  kind: z.enum(["city", "category"]),
  slug: z.string().trim().toLowerCase().min(1).max(40),
});

export async function POST(req: Request) {
  const viewer = await getViewer();
  if (!viewer) {
    return Response.json({ error: { code: "unauthorized", message: "Sign in to subscribe." } }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: { code: "bad_request", message: "Invalid topic." } }, { status: 400 });
  }

  const { kind, slug } = parsed.data;
  const valid = kind === "city" ? Boolean(findCity(slug)) : Boolean(findCategoryHub(slug));
  if (!valid) {
    return Response.json({ error: { code: "not_found", message: "Unknown topic." } }, { status: 404 });
  }

  const db = await getDB();
  const existing = await db
    .prepare("SELECT 1 AS ok FROM topic_subscriptions WHERE user_id = ? AND topic_kind = ? AND topic_slug = ?")
    .bind(viewer.id, kind, slug)
    .first<{ ok: number }>();

  let subscribed: boolean;
  if (existing?.ok) {
    await db
      .prepare("DELETE FROM topic_subscriptions WHERE user_id = ? AND topic_kind = ? AND topic_slug = ?")
      .bind(viewer.id, kind, slug)
      .run();
    subscribed = false;
  } else {
    await db
      .prepare("INSERT OR IGNORE INTO topic_subscriptions (user_id, topic_kind, topic_slug, created_at) VALUES (?, ?, ?, ?)")
      .bind(viewer.id, kind, slug, nowIso())
      .run();
    subscribed = true;
  }

  const countRow = await db
    .prepare("SELECT COUNT(*) AS n FROM topic_subscriptions WHERE topic_kind = ? AND topic_slug = ?")
    .bind(kind, slug)
    .first<{ n: number }>();

  return Response.json({ ok: true, subscribed, count: Number(countRow?.n ?? 0) });
}
