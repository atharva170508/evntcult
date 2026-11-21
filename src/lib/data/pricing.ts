import "server-only";
import { ApiError } from "@/lib/api";
import { first } from "@/lib/db";
import { applyPromo, normalizeCode, parsePromos, parseTiers, promoLabel } from "@/lib/tickets";

export interface Priced {
  amountPaise: number;
  basePaise: number;
  tier: string | null;
  promo: string | null;
  promoLabel: string | null;
}

/**
 * What a guest pays for an event, from the ticket type they chose and an optional promo code.
 * Throws a clear 400 for an unknown ticket type, or a code that doesn't exist or is used up.
 */
export async function resolvePrice(
  e: { id: string; price_paise: number; tiers: string | null; promos: string | null },
  tierId: string | null | undefined,
  code: string | null | undefined,
): Promise<Priced> {
  const tiers = parseTiers(e.tiers);
  let base = e.price_paise;
  let tier: string | null = null;
  if (tiers.length) {
    const t = tierId ? tiers.find((x) => x.id === tierId) : tiers[0];
    if (!t) throw new ApiError(400, "bad_tier", "Pick a ticket type.");
    base = t.pricePaise;
    tier = t.name;
  }
  const c = code ? normalizeCode(code) : "";
  if (!c) return { amountPaise: base, basePaise: base, tier, promo: null, promoLabel: null };
  const promo = parsePromos(e.promos).find((p) => p.code === c);
  if (!promo) throw new ApiError(400, "bad_promo", "That code isn't valid for this event.");
  if (promo.maxUses) {
    const used = await first<{ n: number }>(
      "SELECT COUNT(*) AS n FROM registrations WHERE event_id = ? AND promo_code = ? AND status IN ('registered','waitlisted')",
      e.id,
      c,
    );
    if ((used?.n ?? 0) >= promo.maxUses) throw new ApiError(400, "promo_used_up", "That code has been used up.");
  }
  return { amountPaise: applyPromo(base, promo), basePaise: base, tier, promo: c, promoLabel: promoLabel(promo) };
}
