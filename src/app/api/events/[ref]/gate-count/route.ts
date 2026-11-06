import { handle } from "@/lib/api";
import { getDB } from "@/lib/db";
import { requireEventOwner } from "@/lib/rbac";
import { gateCounts } from "@/lib/data/checkins";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ ref: string }> };

/** GET /api/events/:id/gate-count — fallback for when the live connection isn't available. */
export const GET = handle(async (_req: Request, { params }: Ctx) => {
  const { ref } = await params;
  await requireEventOwner(ref);
  return Response.json(await gateCounts(await getDB(), ref), { headers: { "Cache-Control": "no-store" } });
});
