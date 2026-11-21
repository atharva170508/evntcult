"use client";

import { useEffect, useRef, useState } from "react";
import { Section, apiJson } from "./primitives";

interface Rules {
  regClosesAt: string | null;
  requiresApproval: boolean;
  agenda: string | null;
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
            <input
              type="datetime-local"
              aria-label="Registration closes at"
              className="o-input o-mono"
              style={{ maxWidth: 240 }}
              value={toLocal(rules.regClosesAt)}
              onChange={(e) => save({ ...rules, regClosesAt: fromLocal(e.target.value) })}
            />
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
          <label className="o-inline" style={{ fontSize: 14 }}>
            <input type="checkbox" checked={rules.requiresApproval} onChange={(e) => save({ ...rules, requiresApproval: e.target.checked }, 0)} /> I approve each sign-up
          </label>
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
    </Section>
  );
}
