"use client";

import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { Button, Section, apiJson } from "./primitives";
import { Select } from "@/components/ui/Select";
import type { Promo, Tier } from "@/lib/tickets";

type TierDraft = { id?: string; name: string; rupees: string; seats: string };
type PromoDraft = { code: string; kind: "pct" | "amt"; value: string; maxUses: string };

const toTierDraft = (t: Tier): TierDraft => ({ id: t.id, name: t.name, rupees: String(t.pricePaise / 100), seats: t.capacity ? String(t.capacity) : "" });
const toPromoDraft = (p: Promo): PromoDraft => ({
  code: p.code,
  kind: p.percentOff ? "pct" : "amt",
  value: String(p.percentOff ?? (p.amountOffPaise ?? 0) / 100),
  maxUses: p.maxUses ? String(p.maxUses) : "",
});

/**
 * Ticket types (Stag, Couple, VIP…) each with their own price, and promo codes that take a
 * percentage or an amount off. Guests pick a type and can enter a code when they register.
 */
export function TicketsSetup({ eventId }: { eventId: string }) {
  const [tiers, setTiers] = useState<TierDraft[] | null>(null);
  const [promos, setPromos] = useState<PromoDraft[]>([]);
  const [uses, setUses] = useState<Record<string, number>>({});
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void apiJson<{ tiers: Tier[]; promos: Promo[]; uses: Record<string, number> }>(`/api/events/${eventId}/tickets`, "GET").then((r) => {
      if (!r.ok) return;
      setTiers(r.data.tiers.map(toTierDraft));
      setPromos(r.data.promos.map(toPromoDraft));
      setUses(r.data.uses);
    });
  }, [eventId]);

  async function save() {
    if (!tiers) return;
    setBusy(true);
    setMsg(null);
    const r = await apiJson<{ tiers: Tier[]; promos: Promo[]; uses: Record<string, number> }>(`/api/events/${eventId}/tickets`, "PUT", {
      tiers: tiers.filter((t) => t.name.trim()).map((t) => ({ id: t.id, name: t.name, pricePaise: Math.round(Number(t.rupees || 0) * 100), capacity: t.seats ? Number(t.seats) : null })),
      promos: promos
        .filter((p) => p.code.trim())
        .map((p) => ({
          code: p.code,
          ...(p.kind === "pct" ? { percentOff: Number(p.value) } : { amountOffPaise: Math.round(Number(p.value) * 100) }),
          maxUses: p.maxUses ? Number(p.maxUses) : null,
        })),
    });
    setBusy(false);
    if (!r.ok) return setMsg({ ok: false, text: r.data.error?.message ?? "Didn't save. Check your connection." });
    setTiers(r.data.tiers.map(toTierDraft));
    setPromos(r.data.promos.map(toPromoDraft));
    setUses(r.data.uses);
    setMsg({ ok: true, text: "Saved. New guests see these straight away." });
  }

  if (!tiers) return null;

  return (
    <Section n="10" label="Ticket types and codes">
      <div className="o-row">
        <span className="o-label">Ticket types</span>
        <div>
          <div style={{ display: "grid", gap: 8 }}>
            {tiers.map((t, i) => (
              <div key={i} className="o-inline" style={{ gap: 8 }}>
                <input aria-label="Ticket type name" className="o-input" style={{ flex: 1, minWidth: 0 }} placeholder="Couple" maxLength={30} value={t.name} onChange={(e) => setTiers(tiers.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
                <span className="o-meta">₹</span>
                <input aria-label={`Price for ${t.name || "ticket type"}`} className="o-input o-mono" style={{ width: 96 }} inputMode="numeric" placeholder="0" value={t.rupees} onChange={(e) => setTiers(tiers.map((x, j) => (j === i ? { ...x, rupees: e.target.value.replace(/[^\d.]/g, "") } : x)))} />
                <input
                  aria-label={`Seats for ${t.name || "ticket type"}`}
                  className="o-input o-mono"
                  style={{ width: 96 }}
                  inputMode="numeric"
                  placeholder="Seats"
                  value={t.seats}
                  onChange={(e) => setTiers(tiers.map((x, j) => (j === i ? { ...x, seats: e.target.value.replace(/\D/g, "") } : x)))}
                />
                <button type="button" aria-label={`Remove ${t.name || "ticket type"}`} className="o-link" onClick={() => setTiers(tiers.filter((_, j) => j !== i))}>
                  <X className="size-4" aria-hidden />
                </button>
              </div>
            ))}
          </div>
          {tiers.length < 6 && (
            <button type="button" className="o-link" style={{ marginTop: 10, fontSize: 13.5, display: "inline-flex", alignItems: "center", gap: 4 }} onClick={() => setTiers([...tiers, { name: "", rupees: "", seats: "" }])}>
              <Plus className="size-3.5" aria-hidden /> Add a ticket type
            </button>
          )}
        </div>
      </div>
      <div className="o-row">
        <span className="o-label">Promo codes</span>
        <div>
          <div style={{ display: "grid", gap: 8 }}>
            {promos.map((p, i) => (
              <div key={i} className="o-inline" style={{ gap: 8, flexWrap: "wrap" }}>
                <input aria-label="Code" className="o-input o-mono" style={{ width: 140, textTransform: "uppercase" }} placeholder="CLUB20" maxLength={20} value={p.code} onChange={(e) => setPromos(promos.map((x, j) => (j === i ? { ...x, code: e.target.value } : x)))} />
                <input aria-label="Discount" className="o-input o-mono" style={{ width: 80 }} inputMode="numeric" placeholder="20" value={p.value} onChange={(e) => setPromos(promos.map((x, j) => (j === i ? { ...x, value: e.target.value.replace(/[^\d.]/g, "") } : x)))} />
                <Select
                  size="sm"
                  label="Discount type"
                  value={p.kind}
                  onChange={(k) => setPromos(promos.map((x, j) => (j === i ? { ...x, kind: k } : x)))}
                  options={[
                    { value: "pct", label: "% off" },
                    { value: "amt", label: "₹ off" },
                  ]}
                />
                <input aria-label="Maximum uses" className="o-input o-mono" style={{ width: 96 }} inputMode="numeric" placeholder="No limit" value={p.maxUses} onChange={(e) => setPromos(promos.map((x, j) => (j === i ? { ...x, maxUses: e.target.value.replace(/\D/g, "") } : x)))} />
                <span className="o-meta" style={{ minWidth: 52 }}>{uses[p.code.toUpperCase()] ? `${uses[p.code.toUpperCase()]} used` : ""}</span>
                <button type="button" aria-label={`Remove code ${p.code}`} className="o-link" onClick={() => setPromos(promos.filter((_, j) => j !== i))}>
                  <X className="size-4" aria-hidden />
                </button>
              </div>
            ))}
          </div>
          {promos.length < 20 && (
            <button type="button" className="o-link" style={{ marginTop: 10, fontSize: 13.5, display: "inline-flex", alignItems: "center", gap: 4 }} onClick={() => setPromos([...promos, { code: "", kind: "pct", value: "", maxUses: "" }])}>
              <Plus className="size-3.5" aria-hidden /> Add a code
            </button>
          )}
        </div>
      </div>
      <div className="o-row">
        <span className="o-label" />
        <div className="o-inline" style={{ gap: 12 }}>
          <Button variant="primary" onClick={save} disabled={busy}>
            {busy ? "Saving…" : "Save tickets"}
          </Button>
          {msg && (
            <span role="status" className="o-meta" style={{ color: msg.ok ? undefined : "var(--accent-ink)" }}>
              {msg.text}
            </span>
          )}
        </div>
      </div>
    </Section>
  );
}
