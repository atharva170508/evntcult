import { z } from "zod";
import { ApiError, handle, parseBody } from "@/lib/api";
import { first, getDB } from "@/lib/db";
import { requireEventOwner } from "@/lib/rbac";
import { cleanConfig, kindFor, parseConfig } from "@/lib/categories";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ ref: string }> };

const body = z.object({ config: z.record(z.string(), z.unknown()) }).strict();

/** GET — this event's category setup. */
export const GET = handle(async (_req: Request, { params }: Ctx) => {
  const { ref } = await params;
  await requireEventOwner(ref);
  const e = await first<{
    category: string | null;
    category_config: string | null;
  }>("SELECT category, category_config FROM events WHERE id = ?", ref);
  if (!e) throw new ApiError(404, "not_found", "Event not found.");
  return Response.json({
    kind: kindFor(e.category)?.key ?? null,
    config: parseConfig(e.category_config),
  });
});

/** PUT { config } — save it. Only fields the event's category defines are kept. */
export const PUT = handle(async (req: Request, { params }: Ctx) => {
  const { ref } = await params;
  await requireEventOwner(ref);
  const b = await parseBody(req, body);
  const e = await first<{ category: string | null }>(
    "SELECT category FROM events WHERE id = ?",
    ref,
  );
  if (!e) throw new ApiError(404, "not_found", "Event not found.");
  const kind = kindFor(e.category);
  if (!kind) throw new ApiError(400, "no_category", "Pick a category first.");
  const config = cleanConfig(kind, b.config);
  const db = await getDB();
  await db
    .prepare(
      "UPDATE events SET category_config = ?, updated_at = ? WHERE id = ?",
    )
    .bind(JSON.stringify(config), new Date().toISOString(), ref)
    .run();
  return Response.json({ kind: kind.key, config });
});
