"use client";

import { useEffect, useState } from "react";
import { Button, Section, apiJson } from "./primitives";

interface Item {
  id: string;
  name: string;
  variant: string | null;
  left: number | null;
  claimed: number;
}

/** Goodies for this event. Each line is one item and size; each pass can collect it once. */
export function MerchSetup({ eventId }: { eventId: string }) {
  const [items, setItems] = useState<Item[]>([]);
  const [name, setName] = useState("");
  const [variant, setVariant] = useState("");
  const [stock, setStock] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const r = await apiJson<{ items: Item[] }>(`/api/events/${eventId}/merch`, "GET");
    if (r.ok) setItems(r.data.items);
  };
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  async function add() {
    if (!name.trim()) return setError("Give the item a name.");
    setBusy(true);
    setError(null);
    const r = await apiJson(`/api/events/${eventId}/merch`, "POST", { name: name.trim(), variant: variant.trim() || null, stock: stock === "" ? null : Number(stock) });
    setBusy(false);
    if (!r.ok) return setError(r.data.error?.message ?? "Couldn't add it.");
    setName("");
    setVariant("");
    setStock("");
    void load();
  }

  async function remove(id: string) {
    const r = await apiJson(`/api/events/${eventId}/merch?item=${encodeURIComponent(id)}`, "DELETE");
    if (!r.ok) return setError(r.data.error?.message ?? "Couldn't remove it.");
    void load();
  }

  return (
    <Section n="06" label="Merch">
      <div className="o-row">
        <span className="o-label">Add item</span>
        <div>
          <div className="o-inline">
            <input aria-label="Item name" className="o-input" style={{ flex: 2, minWidth: 0 }} placeholder="T-shirt" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} />
            <input aria-label="Variant" className="o-input" style={{ flex: 1, minWidth: 0 }} placeholder="M" maxLength={40} value={variant} onChange={(e) => setVariant(e.target.value)} />
            <input aria-label="Stock" className="o-input o-mono" style={{ flex: 1, minWidth: 0 }} placeholder="stock" inputMode="numeric" value={stock} onChange={(e) => setStock(e.target.value.replace(/\D/g, "").slice(0, 6))} />
            <Button disabled={busy} onClick={add}>Add</Button>
          </div>
          {error && <p className="o-err" role="alert">{error}</p>}
        </div>
      </div>
      {items.length > 0 && (
        <div className="o-row">
          <span className="o-label">Items</span>
          <div>
            {items.map((i) => (
              <div className="o-merch-row" key={i.id}>
                <span>{i.variant ? `${i.name} · ${i.variant}` : i.name}</span>
                <span className="o-meta">{i.left === null ? "unlimited" : `${i.left} left`}</span>
                {i.claimed === 0 ? (
                  <button type="button" className="o-link" style={{ fontSize: 11 }} onClick={() => remove(i.id)}>Remove</button>
                ) : (
                  <span className="o-meta">{i.claimed} claimed</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </Section>
  );
}
