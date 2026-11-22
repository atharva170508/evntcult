"use client";

import { useEffect, useRef, useState } from "react";
import { Section, apiJson } from "./primitives";
import { DatePicker, TimePicker } from "@/components/ui/DatePicker";
import { Switch } from "@/components/ui/Switch";
import { EFFECTS, EFFECT_KEYS, PAGE_STYLES, PAGE_STYLE_KEYS, TITLE_FONTS, TITLE_FONT_KEYS, parseLook } from "@/lib/effects";

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
export function SignupRules({ eventId }: { eventId: string }) {
  const [rules, setRules] = useState<Rules | null>(null);
  const [saved, setSaved] = useState<"idle" | "saving" | "saved" | "error">("idle");
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
          <p className="o-meta" style={{ marginTop: 6 }}>
            {rules.regClosesAt ? "After this, the Register button is replaced with Registration closed." : "Leave empty to take sign-ups until the event ends."}{" "}
            <span aria-live="polite">{saved === "saving" ? "Saving…" : saved === "saved" ? "Saved." : saved === "error" ? "Didn't save. Check your connection." : ""}</span>
          </p>
        </div>
      </div>
      <div className="o-row">
        <span className="o-label">Approval</span>
        <div>
          <Switch label="I approve each sign-up" checked={rules.requiresApproval} onChange={(v) => save({ ...rules, requiresApproval: v }, 0)} className="max-w-[420px]" />
          <p className="o-meta" style={{ marginTop: 6 }}>
            Guests send a request instead of getting a pass straight away. Approve or decline them from Manage; approved guests get their pass.
          </p>
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
            placeholder="Bring your college ID. Gates open at 6:30 pm, use Gate 3."
            onBlur={(e) => e.target.value.trim() !== (rules.confirmMessage ?? "") && save({ ...rules, confirmMessage: e.target.value.trim() || null }, 0)}
            style={{ height: "auto", paddingTop: 10, paddingBottom: 10, lineHeight: 1.5 }}
          />
          <p className="o-meta" style={{ marginTop: 6 }}>
            Guests see this note from you right after they register, and on their pass.
          </p>
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
          <p className="o-meta" style={{ marginTop: 6 }}>
            Shown under Good to know on your event page. Leave empty for free events.
          </p>
        </div>
      </div>
      <div className="o-row">
        <span className="o-label">Page look</span>
        <div>
          <div className="o-chips" role="group" aria-label="Background">
            {PAGE_STYLE_KEYS.map((k) => (
              <button key={k} type="button" className="o-chip" title={PAGE_STYLES[k].hint} aria-pressed={parseLook(rules.look).style === k} onClick={() => save({ ...rules, look: `${k}:${parseLook(rules.look).font}` }, 0)}>
                {PAGE_STYLES[k].label}
              </button>
            ))}
          </div>
          <div className="o-chips" role="group" aria-label="Title font" style={{ marginTop: 8 }}>
            {TITLE_FONT_KEYS.map((k) => (
              <button key={k} type="button" className={`o-chip ${TITLE_FONTS[k].cls}`} style={{ fontSize: 14 }} aria-pressed={parseLook(rules.look).font === k} onClick={() => save({ ...rules, look: `${parseLook(rules.look).style}:${k}` }, 0)}>
                {TITLE_FONTS[k].label}
              </button>
            ))}
          </div>
          <p className="o-meta" style={{ marginTop: 6 }}>
            The background behind your event page and the type of its title.
          </p>
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
          <p className="o-meta" style={{ marginTop: 6 }}>
            A few emoji drift down your event page. Hidden for people who turn off animations.
          </p>
        </div>
      </div>
    </Section>
  );
}
