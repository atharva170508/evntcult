import { ApiError, handle } from "@/lib/api";
import { first, getDB } from "@/lib/db";
import { requireEventOwner } from "@/lib/rbac";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ ref: string }> };

const MAX = 900 * 1024;
const TYPES = new Set(["image/webp", "image/jpeg", "image/png"]);

/** GET — the event's poster image. Cached; the URL carries a version so a new upload shows at once. */
export async function GET(_req: Request, { params }: Ctx) {
  const { ref } = await params;
  const p = await first<{ mime: string; data: ArrayBuffer | number[] }>("SELECT mime, data FROM event_posters WHERE event_id = ?", ref);
  if (!p) return new Response("Not found", { status: 404 });
  const bytes = p.data instanceof ArrayBuffer ? new Uint8Array(p.data) : Uint8Array.from(p.data);
  return new Response(bytes, { headers: { "Content-Type": p.mime, "Cache-Control": "public, max-age=31536000, immutable" } });
}

/** PUT (raw image body) — save a poster and point the event at it. Resize in the browser first. */
export const PUT = handle(async (req: Request, { params }: Ctx) => {
  const { ref } = await params;
  await requireEventOwner(ref);
  const mime = (req.headers.get("content-type") ?? "").split(";")[0].trim();
  if (!TYPES.has(mime)) throw new ApiError(415, "bad_type", "Use a JPG, PNG or WebP image.");
  const buf = await req.arrayBuffer();
  if (buf.byteLength === 0) throw new ApiError(400, "empty", "That file is empty.");
  if (buf.byteLength > MAX) throw new ApiError(413, "too_big", "That image is too large. Try a smaller one.");
  const now = new Date().toISOString();
  const url = `/api/events/${ref}/poster?v=${Date.parse(now).toString(36)}`;
  const db = await getDB();
  await db.batch([
    db
      .prepare("INSERT INTO event_posters (event_id, mime, data, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT (event_id) DO UPDATE SET mime = excluded.mime, data = excluded.data, updated_at = excluded.updated_at")
      .bind(ref, mime, new Uint8Array(buf), now),
    db.prepare("UPDATE events SET banner_url = ?, updated_at = ? WHERE id = ?").bind(url, now, ref),
  ]);
  return Response.json({ url });
});

/** DELETE — remove the poster; the event goes back to its drawn cover. */
export const DELETE = handle(async (_req: Request, { params }: Ctx) => {
  const { ref } = await params;
  await requireEventOwner(ref);
  const db = await getDB();
  await db.batch([
    db.prepare("DELETE FROM event_posters WHERE event_id = ?").bind(ref),
    db.prepare("UPDATE events SET banner_url = NULL, updated_at = ? WHERE id = ? AND banner_url LIKE '/api/events/%/poster%'").bind(new Date().toISOString(), ref),
  ]);
  return Response.json({ ok: true });
});
