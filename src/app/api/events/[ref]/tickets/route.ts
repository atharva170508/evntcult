import { z } from "zod";
import { ApiError, handle, parseBody } from "@/lib/api";
import { all, first, getDB } from "@/lib/db";
import { requireEventOwner } from "@/lib/rbac";
import { cleanPromos, cleanTiers, parsePromos, parseTiers } from "@/lib/tickets";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ ref: string }> };

async function read(ref: string) {
  const e = await first<{ tiers: string | null; promos: string | null }>("SELECT tiers, promos FROM events WHERE id = ?", ref);
  if (!e) throw new ApiError(404, "not_found", "Event not found.");
  const uses = await all<{ promo_code: string; n: number }>(
    "SELECT promo_code, COUNT(*) AS n FROM registrations WHERE event_id = ? AND promo_code IS NOT NULL AND status IN ('registered','waitlisted') GROUP BY promo_code",
    ref,
  );
  return { tiers: parseTiers(e.tiers), promos: parsePromos(e.promos), uses: Object.fromEntries(uses.map((u) => [u.promo_code, u.n])) };
}

/** GET — ticket types, promo codes, and how often each code was used. */
export const GET = handle(async (_req: Request, { params }: Ctx) => {
  const { ref } = await params;
  await requireEventOwner(ref);
  return Response.json(await read(ref));
});

const body = z.object({ tiers: z.array(z.unknown()).max(6), promos: z.array(z.unknown()).max(20) }).strict();

/** PUT { tiers, promos } — save them (cleaned). Existing guests keep the price they signed up at. */
export const PUT = handle(async (req: Request, { params }: Ctx) => {
  const { ref } = await params;
  await requireEventOwner(ref);
  const b = await parseBody(req, body);
  const tiers = cleanTiers(b.tiers);
  const promos = cleanPromos(b.promos);
  const db = await getDB();
  await db
    .prepare("UPDATE events SET tiers = ?, promos = ?, updated_at = ? WHERE id = ?")
    .bind(tiers.length ? JSON.stringify(tiers) : null, promos.length ? JSON.stringify(promos) : null, new Date().toISOString(), ref)
    .run();
  return Response.json(await read(ref));
});
