"use client";

import { useEffect, useState } from "react";
import { Button, Section, Segmented, apiJson } from "./primitives";
import type { Question } from "@/lib/data/questions";

/** One-click questions college fests and hackathons ask for, ready to count and export. */
const PRESETS: { name: string; label: string; kind: "text" | "choice"; options?: string[]; required: boolean }[] = [
  { name: "Food", label: "Food preference", kind: "choice", options: ["Veg", "Non-veg", "Jain", "Vegan", "Eggetarian"], required: true },
  { name: "Allergies", label: "Allergies or food you can't eat", kind: "text", required: false },
  { name: "T-shirt size", label: "T-shirt size", kind: "choice", options: ["XS", "S", "M", "L", "XL", "XXL"], required: true },
  { name: "College", label: "College", kind: "text", required: true },
  { name: "Year", label: "Year of study", kind: "choice", options: ["1st year", "2nd year", "3rd year", "4th year", "Other"], required: true },
  { name: "Roll number", label: "Roll number", kind: "text", required: false },
  { name: "GitHub or LinkedIn", label: "GitHub or LinkedIn", kind: "text", required: false },
  { name: "Team name", label: "Team name", kind: "text", required: false },
];

export function QuestionsSetup({ eventId }: { eventId: string }) {
  const [items, setItems] = useState<Question[]>([]);
  const [label, setLabel] = useState("");
  const [kind, setKind] = useState<"text" | "choice">("text");
  const [options, setOptions] = useState("");
  const [required, setRequired] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const r = await apiJson<{ questions: Question[] }>(`/api/events/${eventId}/questions`, "GET");
    if (r.ok) setItems(r.data.questions);
  };
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  async function add() {
    if (!label.trim()) return setError("Write the question.");
    setBusy(true);
    setError(null);
    const r = await apiJson(`/api/events/${eventId}/questions`, "POST", { label: label.trim(), kind, options: kind === "choice" ? options.split(",") : [], required });
    setBusy(false);
    if (!r.ok) return setError(r.data.error?.message ?? "Couldn't add it.");
    setLabel("");
    setOptions("");
    setRequired(false);
    void load();
  }

  async function addPreset(p: (typeof PRESETS)[number]) {
    setBusy(true);
    setError(null);
    const r = await apiJson(`/api/events/${eventId}/questions`, "POST", { label: p.label, kind: p.kind, options: p.options ?? [], required: p.required });
    setBusy(false);
    if (!r.ok) return setError(r.data.error?.message ?? "Couldn't add it.");
    void load();
  }

  async function remove(id: string) {
    const r = await apiJson(`/api/events/${eventId}/questions?id=${encodeURIComponent(id)}`, "DELETE");
    if (!r.ok) return setError(r.data.error?.message ?? "Couldn't remove it.");
    void load();
  }

  return (
    <Section n="08" label="Questions">
      <div className="o-row">
        <span className="o-label">Quick add</span>
        <div className="o-chips" role="group" aria-label="Common questions">
          {PRESETS.filter((p) => !items.some((q) => q.label === p.label)).map((p) => (
            <button key={p.name} type="button" className="o-chip" disabled={busy} onClick={() => addPreset(p)}>
              + {p.name}
            </button>
          ))}
        </div>
      </div>
      <div className="o-row">
        <span className="o-label">Add question</span>
        <div>
          <input aria-label="Question" className="o-input" placeholder="T-shirt size" maxLength={120} value={label} onChange={(e) => setLabel(e.target.value)} />
          <div className="o-inline" style={{ marginTop: 8, flexWrap: "wrap" }}>
            <Segmented
              label="Answer type"
              value={kind}
              options={[
                ["text", "Text"],
                ["choice", "Choice"],
              ]}
              onChange={setKind}
            />
            <label className="o-inline" style={{ fontSize: 13 }}>
              <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} /> Required
            </label>
            <span className="o-spacer" />
            <Button disabled={busy} onClick={add}>Add</Button>
          </div>
          {kind === "choice" && <input aria-label="Choices" className="o-input" style={{ marginTop: 8 }} placeholder="S, M, L, XL" value={options} onChange={(e) => setOptions(e.target.value)} />}
          {error && <p className="o-err" role="alert">{error}</p>}
        </div>
      </div>
      {items.length > 0 && (
        <div className="o-row">
          <span className="o-label">Questions</span>
          <div>
            {items.map((q) => (
              <div className="o-merch-row" key={q.id}>
                <span>{q.label}</span>
                <span className="o-meta">{q.kind === "choice" ? q.options.join(", ") : "text"}{q.required ? " · required" : ""}</span>
                <button type="button" className="o-link" style={{ fontSize: 12.5 }} onClick={() => remove(q.id)}>Remove</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </Section>
  );
}
