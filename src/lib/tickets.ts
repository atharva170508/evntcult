/**
 * Ticket types and promo codes. Both live as JSON on the event. A ticket type is a name and a
 * price (Stag ₹499, Couple ₹899, VIP ₹1,499); a promo code takes a percentage or a fixed amount
 * off, optionally up to a number of uses. What a guest owes is stored on their registration.
 */

export interface Tier {
  id: string;
  name: string;
  pricePaise: number;
  /** Seats for this type; empty = only the event's capacity applies. */
  capacity?: number | null;
}

export interface Promo {
  code: string;
  /** Exactly one of these. */
  percentOff?: number;
  amountOffPaise?: number;
  maxUses?: number | null;
}

function parse<T>(raw: string | null | undefined): T[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw) as unknown;
    return Array.isArray(v) ? (v as T[]) : [];
  } catch {
    return [];
  }
}

export const parseTiers = (raw: string | null | undefined) =>
  parse<Tier>(raw).filter((t) => t && typeof t.name === "string" && Number.isInteger(t.pricePaise) && t.pricePaise >= 0);

export const parsePromos = (raw: string | null | undefined) => parse<Promo>(raw).filter((p) => p && typeof p.code === "string");

export const normalizeCode = (c: string) => c.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 20);

/** Untrusted input -> clean tiers (max 6, names unique). */
export function cleanTiers(input: unknown): Tier[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  const out: Tier[] = [];
  for (const t of input.slice(0, 6)) {
    const name = String((t as Tier)?.name ?? "").trim().slice(0, 30);
    const price = Math.round(Number((t as Tier)?.pricePaise));
    if (!name || seen.has(name.toLowerCase()) || !Number.isFinite(price) || price < 0 || price > 10_000_000) continue;
    seen.add(name.toLowerCase());
    const id = String((t as Tier)?.id ?? "").replace(/[^a-z0-9]/gi, "").slice(0, 12) || name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 12) || `t${out.length}`;
    const capRaw = (t as Tier)?.capacity;
    const cap = capRaw == null || (capRaw as unknown) === "" ? null : Math.max(1, Math.min(1_000_000, Math.round(Number(capRaw))));
    out.push({ id, name, pricePaise: price, ...(cap && Number.isFinite(cap) ? { capacity: cap } : {}) });
  }
  return out;
}

/** Untrusted input -> clean promo codes (max 20, codes unique). */
export function cleanPromos(input: unknown): Promo[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  const out: Promo[] = [];
  for (const p of input.slice(0, 20)) {
    const code = normalizeCode(String((p as Promo)?.code ?? ""));
    if (code.length < 3 || seen.has(code)) continue;
    const pct = Math.round(Number((p as Promo)?.percentOff));
    const amt = Math.round(Number((p as Promo)?.amountOffPaise));
    const max = (p as Promo)?.maxUses == null ? null : Math.max(1, Math.round(Number((p as Promo).maxUses)));
    const promo: Promo = { code, maxUses: Number.isFinite(max as number) ? max : null };
    if (Number.isFinite(pct) && pct > 0) promo.percentOff = Math.min(100, pct);
    else if (Number.isFinite(amt) && amt > 0) promo.amountOffPaise = Math.min(10_000_000, amt);
    else continue;
    seen.add(code);
    out.push(promo);
  }
  return out;
}

/** What someone owes for a base price after a promo. Never below zero. */
export function applyPromo(basePaise: number, promo: Promo | null | undefined): number {
  if (!promo) return basePaise;
  // Rounded to whole rupees: ₹719, not ₹719.20.
  if (promo.percentOff) return Math.max(0, Math.round((basePaise * (100 - promo.percentOff)) / 10000) * 100);
  if (promo.amountOffPaise) return Math.max(0, basePaise - promo.amountOffPaise);
  return basePaise;
}

/** "20% off" / "₹100 off". */
export function promoLabel(p: Promo): string {
  return p.percentOff ? `${p.percentOff}% off` : `₹${Math.round((p.amountOffPaise ?? 0) / 100).toLocaleString("en-IN")} off`;
}
