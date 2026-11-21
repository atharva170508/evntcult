import { ApiError, handle } from "@/lib/api";
import { first } from "@/lib/db";
import { requireUser } from "@/lib/rbac";
import { resolvePrice } from "@/lib/data/pricing";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ ref: string }> };

/** GET ?code=&tier= — check a promo code and return what the guest would pay. */
export const GET = handle(async (req: Request, { params }: Ctx) => {
  await requireUser();
  const { ref } = await params;
  const url = new URL(req.url);
  const e = await first<{ id: string; price_paise: number; tiers: string | null; promos: string | null }>(
    "SELECT id, price_paise, tiers, promos FROM events WHERE (slug = ? OR id = ?) AND status = 'published'",
    ref,
    ref,
  );
  if (!e) throw new ApiError(404, "not_found", "Event not found.");
  const p = await resolvePrice(e, url.searchParams.get("tier"), url.searchParams.get("code"));
  return Response.json(p);
});
