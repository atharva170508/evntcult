"use client";

import { useEffect, useRef, useState } from "react";
import { Section, apiJson } from "./primitives";
import { DatePicker, TimePicker } from "@/components/ui/DatePicker";
import { Switch } from "@/components/ui/Switch";
import {
  EFFECTS,
  EFFECT_KEYS,
  EVENT_THEME_PRESETS,
  PAGE_STYLES,
  PAGE_STYLE_KEYS,
  THEME_CATEGORIES,
  TITLE_FONTS,
  TITLE_FONT_KEYS,
  parseLook,
  type ThemeCategoryCode,
} from "@/lib/effects";

interface Rules {
  regClosesAt: string | null;
  requiresApproval: boolean;
  agenda: string | null;
  effect?: string | null;
  refundPolicy?: string | null;
  look?: string | null;
  confirmMessage?: string | null;
}

/** ISO -> "YYYY-MM-DDTHH:mm" in IST, for a datetime-local input. */
function toLocal(iso: string | null) {
  if (!iso) return "";
  const d = new Date(Date.parse(iso) + 330 * 60_000);
  return d.toISOString().slice(0, 16);
}
/** "YYYY-MM-DDTHH:mm" (IST) -> ISO. */
const fromLocal = (v: string) => (v ? new Date(`${v}:00+05:30`).toISOString() : null);

/**
 * Sign-up rules, saved on their own: when registration closes, whether each sign-up waits for
 * your approval, and the agenda shown on the event page.
 */
export function SignupRules({ eventId, category }: { eventId: string; category?: string | null }) {
  const [rules, setRules] = useState<Rules | null>(null);
  const [saved, setSaved] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const initialCat = (THEME_CATEGORIES.find((c) => c.code === (category ?? "").toUpperCase())?.code ?? "SPORTS") as ThemeCategoryCode;
  const [themeCat, setThemeCat] = useState<ThemeCategoryCode>(initialCat);

  useEffect(() => {
    const matched = THEME_CATEGORIES.find((c) => c.code === (category ?? "").toUpperCase())?.code;
    if (matched) setThemeCat(matched);
  }, [category]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    void apiJson<Rules>(`/api/events/${eventId}/rules`, "GET").then((r) => r.ok && setRules(r.data));
  }, [eventId]);

  const save = (next: Rules, wait = 400) => {
    setRules(next);
    setSaved("saving");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const r = await apiJson<Rules>(`/api/events/${eventId}/rules`, "PUT", next);
      setSaved(r.ok ? "saved" : "error");
    }, wait);
  };

  if (!rules) return null;

  return (
    <Section n="09" label="Sign-up rules">
      <div className="o-row">
        <span className="o-label">Closes</span>
        <div>
          <div className="o-inline" style={{ gap: 8 }}>
            <DatePicker
              label="Registration closes on"
              className="w-[220px]"
              placeholder="No cut-off"
              value={toLocal(rules.regClosesAt).slice(0, 10)}
              onChange={(d) => save({ ...rules, regClosesAt: fromLocal(`${d}T${toLocal(rules.regClosesAt).slice(11, 16) || "23:59"}`) }, 0)}
            />
            {rules.regClosesAt && (
              <TimePicker
                label="Registration closes at"
                className="w-[130px]"
                value={toLocal(rules.regClosesAt).slice(11, 16)}
                onChange={(t) => save({ ...rules, regClosesAt: fromLocal(`${toLocal(rules.regClosesAt).slice(0, 10)}T${t}`) }, 0)}
              />
            )}
            {rules.regClosesAt && (
              <button type="button" className="o-link" style={{ fontSize: 12.5 }} onClick={() => save({ ...rules, regClosesAt: null }, 0)}>
                Clear
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="o-row">
        <span className="o-label">Approval</span>
        <div>
          <Switch label="I approve each sign-up" checked={rules.requiresApproval} onChange={(v) => save({ ...rules, requiresApproval: v }, 0)} className="max-w-[420px]" />
        </div>
      </div>
      <div className="o-row">
        <span className="o-label">Agenda</span>
        <div>
          <textarea
            aria-label="Agenda"
            className="o-input"
            rows={4}
            placeholder={"7:00 pm, Doors open\n7:30 pm, Opening act\n9:00 pm, Prize giving"}
            defaultValue={rules.agenda ?? ""}
            onBlur={(e) => e.target.value !== (rules.agenda ?? "") && save({ ...rules, agenda: e.target.value.trim() || null }, 0)}
            style={{ height: "auto", paddingTop: 10, paddingBottom: 10, lineHeight: 1.5 }}
          />
          <p className="o-meta" style={{ marginTop: 6 }}>
            One item per line: time, then what happens.
          </p>
        </div>
      </div>
      <div className="o-row">
        <span className="o-label">After sign-up</span>
        <div>
          <textarea
            aria-label="Message after sign-up"
            className="o-input"
            rows={2}
            maxLength={500}
            defaultValue={rules.confirmMessage ?? ""}
            placeholder="Bring a photo ID. Doors open at 6:30 pm, use Gate 3."
            onBlur={(e) => e.target.value.trim() !== (rules.confirmMessage ?? "") && save({ ...rules, confirmMessage: e.target.value.trim() || null }, 0)}
            style={{ height: "auto", paddingTop: 10, paddingBottom: 10, lineHeight: 1.5 }}
          />
        </div>
      </div>
      <div className="o-row">
        <span className="o-label">Refunds</span>
        <div>
          <textarea
            aria-label="Refund policy"
            className="o-input"
            rows={2}
            maxLength={600}
            defaultValue={rules.refundPolicy ?? ""}
            placeholder="Full refund until 24 hours before. No refunds after that."
            onBlur={(e) => e.target.value.trim() !== (rules.refundPolicy ?? "") && save({ ...rules, refundPolicy: e.target.value.trim() || null }, 0)}
            style={{ height: "auto", paddingTop: 10, paddingBottom: 10, lineHeight: 1.5 }}
          />
        </div>
      </div>
      <div className="o-row">
        <span className="o-label">Event themes</span>
        <div>
          <div className="o-chips" role="tablist" aria-label="Theme category" style={{ marginBottom: 10 }}>
            {THEME_CATEGORIES.map((c) => (
              <button
                key={c.code}
                type="button"
                role="tab"
                aria-selected={themeCat === c.code}
                aria-pressed={themeCat === c.code}
                className="o-chip"
                onClick={() => setThemeCat(c.code)}
              >
                {c.label}
              </button>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 8 }}>
            {EVENT_THEME_PRESETS.filter((p) => p.category === themeCat).map((p) => {
              const cur = parseLook(rules.look);
              const active = cur.style === p.style && cur.font === p.font && (rules.effect ?? "none") === p.effect;
              return (
                <button
                  key={p.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => save({ ...rules, look: `${p.style}:${p.font}`, effect: p.effect }, 0)}
                  style={{
                    textAlign: "left",
                    padding: "12px 13px",
                    borderRadius: 12,
                    border: active ? "2px solid var(--ink)" : "1px solid var(--hair-strong)",
                    background: active ? "var(--sunken)" : "var(--panel)",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 999, background: p.swatch, display: "inline-block" }} />
                    <span style={{ fontSize: 11, opacity: 0.7 }}>{EFFECTS[p.effect].glyphs[0] ?? PAGE_STYLES[p.style].label}</span>
                  </div>
                  <div className={TITLE_FONTS[p.font].cls} style={{ fontSize: 15, marginTop: 7, lineHeight: 1.1 }}>
                    {p.name}
                  </div>
                  <div style={{ fontSize: 11.5, opacity: 0.65, marginTop: 3 }}>{p.vibe}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div className="o-row">
        <span className="o-label">Fine-tune look</span>
        <div>
          <div className="o-chips" role="group" aria-label="Background">
            {PAGE_STYLE_KEYS.map((k) => (
              <button key={k} type="button" className="o-chip" title={PAGE_STYLES[k].hint} aria-pressed={parseLook(rules.look).style === k} onClick={() => save({ ...rules, look: `${k}:${parseLook(rules.look).font}` }, 0)}>
                {PAGE_STYLES[k].label}
              </button>
            ))}
            <button
              type="button"
              className="o-chip"
              title="Pick a random page style, title font, and effect"
              onClick={() => {
                const pick = <T,>(arr: readonly T[]) => arr[Math.floor(Math.random() * arr.length)];
                const nextStyle = pick(PAGE_STYLE_KEYS);
                const nextFont = pick(TITLE_FONT_KEYS);
                const nextEffect = pick(EFFECT_KEYS);
                save({ ...rules, look: `${nextStyle}:${nextFont}`, effect: nextEffect }, 0);
              }}
            >
              Shuffle look
            </button>
          </div>
          <div className="o-chips" role="group" aria-label="Title font" style={{ marginTop: 8 }}>
            {TITLE_FONT_KEYS.map((k) => (
              <button key={k} type="button" className={`o-chip ${TITLE_FONTS[k].cls}`} style={{ fontSize: 14 }} aria-pressed={parseLook(rules.look).font === k} onClick={() => save({ ...rules, look: `${parseLook(rules.look).style}:${k}` }, 0)}>
                {TITLE_FONTS[k].label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="o-row">
        <span className="o-label">Page effect</span>
        <div>
          <div className="o-chips" role="group" aria-label="Page effect">
            {EFFECT_KEYS.map((k) => (
              <button
                key={k}
                type="button"
                className="o-chip"
                aria-pressed={(rules.effect ?? "none") === k}
                onClick={() => save({ ...rules, effect: k }, 0)}
              >
                {EFFECTS[k].glyphs[0] && <span aria-hidden style={{ marginRight: 4 }}>{EFFECTS[k].glyphs[0]}</span>}
                {EFFECTS[k].label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}
