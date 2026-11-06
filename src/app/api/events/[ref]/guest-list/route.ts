import { ApiError, handle } from "@/lib/api";
import { getDB } from "@/lib/db";
import { requireEventOwner } from "@/lib/rbac";
import { buildManifest } from "@/lib/data/checkins";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ ref: string }> };

/**
 * GET /api/events/:id/guest-list — what the scanner saves for offline checking.
 * Pass tokens are hashed (the list can't be turned back into passes); no emails or phone numbers.
 */
export const GET = handle(async (_req: Request, { params }: Ctx) => {
  const { ref } = await params;
  await requireEventOwner(ref);
  const manifest = await buildManifest(await getDB(), ref);
  if (!manifest) throw new ApiError(404, "not_found", "Event not found.");
  return Response.json(manifest, { headers: { "Cache-Control": "private, no-store" } });
});
