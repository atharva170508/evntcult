import { z } from "zod";
import { ApiError, handle, parseBody } from "@/lib/api";
import { first, getDB } from "@/lib/db";
import { getViewer } from "@/lib/rbac";
import { newId } from "@/lib/tokens";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ ref: string }> };

const REASONS = ["Fake or scam", "Wrong details", "Offensive content", "Unsafe event", "Something else"] as const;
const body = z.object({ reason: z.enum(REASONS), details: z.string().trim().max(500).optional() }).strict();

/** POST — report an event to the EvntCult team. Anyone can report; one report per person per event. */
export const POST = handle(async (req: Request, { params }: Ctx) => {
  const { ref } = await params;
  const e = await first<{ id: string }>("SELECT id FROM events WHERE slug = ? OR id = ?", ref, ref);
  if (!e) throw new ApiError(404, "not_found", "Event not found.");
  const viewer = await getViewer();
  const b = await parseBody(req, body);
  if (viewer && (await first("SELECT id FROM event_reports WHERE event_id = ? AND user_id = ?", e.id, viewer.id)))
    return Response.json({ ok: true, already: true });
  const db = await getDB();
  await db
    .prepare("INSERT INTO event_reports (id, event_id, user_id, reason, details, created_at) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(newId(), e.id, viewer?.id ?? null, b.reason, b.details || null, new Date().toISOString())
    .run();
  return Response.json({ ok: true });
});
