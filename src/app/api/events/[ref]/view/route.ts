import { z } from "zod";
import { handle, parseBody } from "@/lib/api";
import { first, getDB } from "@/lib/db";
import { getViewer } from "@/lib/rbac";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ ref: string }> };

const SOURCES = ["whatsapp", "instagram", "google", "linkedin", "x", "evntcult", "qr", "direct", "other"] as const;
const body = z.object({ source: z.enum(SOURCES) }).strict();

/** POST — count one page view (the page sends it once per visit). Hosts viewing their own page don't count. */
export const POST = handle(async (req: Request, { params }: Ctx) => {
  const { ref } = await params;
  const e = await first<{ id: string; organizer_id: string }>("SELECT id, organizer_id FROM events WHERE (slug = ? OR id = ?) AND status IN ('published','closed')", ref, ref);
  if (!e) return Response.json({ ok: false });
  const viewer = await getViewer();
  if (viewer?.id === e.organizer_id) return Response.json({ ok: true, skipped: true });
  const { source } = await parseBody(req, body);
  const day = new Date(Date.now() + 330 * 60_000).toISOString().slice(0, 10);
  const db = await getDB();
  await db
    .prepare("INSERT INTO event_views (event_id, day, source, n) VALUES (?, ?, ?, 1) ON CONFLICT(event_id, day, source) DO UPDATE SET n = n + 1")
    .bind(e.id, day, source)
    .run();
  return Response.json({ ok: true });
});
