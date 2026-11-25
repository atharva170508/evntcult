import { ApiError, handle } from "@/lib/api";
import { first, getDB } from "@/lib/db";
import { requireEventOwner } from "@/lib/rbac";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ ref: string }> };

const MAX = 900 * 1024;

/** Verify real image magic bytes — never trust client Content-Type headers (blocks SVG/HTML XSS). */
function sniffImageMime(b: Uint8Array): "image/jpeg" | "image/png" | "image/webp" | null {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (
    b.length >= 8 &&
    b[0] === 0x89 &&
    b[1] === 0x50 &&
    b[2] === 0x4e &&
    b[3] === 0x47 &&
    b[4] === 0x0d &&
    b[5] === 0x0a &&
    b[6] === 0x1a &&
    b[7] === 0x0a
  ) {
    return "image/png";
  }
  if (
    b.length >= 12 &&
    b[0] === 0x52 &&
    b[1] === 0x49 &&
    b[2] === 0x46 &&
    b[3] === 0x46 &&
    b[8] === 0x57 &&
    b[9] === 0x45 &&
    b[10] === 0x42 &&
    b[11] === 0x50
  ) {
    return "image/webp";
  }
  return null;
}

/** GET — the event's poster image. Cached; the URL carries a version so a new upload shows at once. */
export async function GET(_req: Request, { params }: Ctx) {
  const { ref } = await params;
  const p = await first<{ mime: string; data: ArrayBuffer | number[] }>("SELECT mime, data FROM event_posters WHERE event_id = ?", ref);
  if (!p) return new Response("Not found", { status: 404 });
  const bytes = p.data instanceof ArrayBuffer ? new Uint8Array(p.data) : Uint8Array.from(p.data);
  const safeMime = sniffImageMime(bytes) ?? "application/octet-stream";
  return new Response(bytes, {
    headers: {
      "Content-Type": safeMime,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

/** PUT (raw image body) — save a poster and point the event at it. Resize in the browser first. */
export const PUT = handle(async (req: Request, { params }: Ctx) => {
  const { ref } = await params;
  await requireEventOwner(ref);
  const buf = await req.arrayBuffer();
  if (buf.byteLength === 0) throw new ApiError(400, "empty", "That file is empty.");
  if (buf.byteLength > MAX) throw new ApiError(413, "too_big", "That image is too large. Try a smaller one.");
  const bytes = new Uint8Array(buf);
  const mime = sniffImageMime(bytes);
  if (!mime) throw new ApiError(415, "bad_type", "Use a valid JPG, PNG or WebP image.");
  const now = new Date().toISOString();
  const url = `/api/events/${ref}/poster?v=${Date.parse(now).toString(36)}`;
  const db = await getDB();
  await db.batch([
    db
      .prepare("INSERT INTO event_posters (event_id, mime, data, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT (event_id) DO UPDATE SET mime = excluded.mime, data = excluded.data, updated_at = excluded.updated_at")
      .bind(ref, mime, bytes, now),
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
