"use client";

import { useEffect, useState } from "react";
import { Button, Section, Segmented, apiJson } from "./primitives";
import type { Question } from "@/lib/data/questions";

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

  async function remove(id: string) {
    const r = await apiJson(`/api/events/${eventId}/questions?id=${encodeURIComponent(id)}`, "DELETE");
    if (!r.ok) return setError(r.data.error?.message ?? "Couldn't remove it.");
    void load();
  }

  return (
    <Section n="07" label="Questions">
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
            <label className="o-inline" style={{ fontSize: 12 }}>
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
                <button type="button" className="o-link" style={{ fontSize: 11 }} onClick={() => remove(q.id)}>Remove</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </Section>
  );
}
