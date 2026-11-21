"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Section, apiJson } from "./primitives";
import { kindFor, type CategoryConfig, type Field } from "@/lib/categories";
import type { Question } from "@/lib/data/questions";

/**
 * The part of the editor that changes with the category: a hackathon asks for team size and
 * tracks, a tournament for format and squad size, a party for age limit and lineup, a workshop
 * for speakers and what to bring. Driven entirely by src/lib/categories.ts. Saves on its own.
 */
export function CategorySetup({
  eventId,
  category,
}: {
  eventId: string;
  category: string | null;
}) {
  const kind = kindFor(category);
  const [config, setConfig] = useState<CategoryConfig>({});
  const [saved, setSaved] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [qMsg, setQMsg] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loaded = useRef(false);
  const [ver, setVer] = useState(0); // remount text fields once the saved values arrive

  useEffect(() => {
    loaded.current = false;
    void apiJson<{ config: CategoryConfig }>(
      `/api/events/${eventId}/category`,
      "GET",
    ).then((r) => {
      if (r.ok) setConfig(r.data.config ?? {});
      loaded.current = true;
      setVer((v) => v + 1);
    });
  }, [eventId, category]);

  function update(key: string, value: CategoryConfig[string] | undefined) {
    const next = { ...config };
    if (
      value === undefined ||
      (Array.isArray(value) && value.length === 0) ||
      value === ""
    )
      delete next[key];
    else next[key] = value;
    setConfig(next);
    if (!loaded.current) return;
    setSaved("saving");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const r = await apiJson(`/api/events/${eventId}/category`, "PUT", {
        config: next,
      });
      setSaved(r.ok ? "saved" : "error");
    }, 500);
  }

  async function addQuestions() {
    if (!kind) return;
    setQMsg(null);
    const have = await apiJson<{ questions: Question[] }>(
      `/api/events/${eventId}/questions`,
      "GET",
    );
    const labels = new Set(
      (have.ok ? have.data.questions : []).map((q) => q.label.toLowerCase()),
    );
    let added = 0;
    for (const q of kind.questions) {
      if (labels.has(q.label.toLowerCase())) continue;
      // With team sign-up on, the team comes from the sign-up itself.
      if (q.label === "Team name" && config.teamSignup === true) continue;
      // Tracks come from what you set above.
      const options =
        q.label === "Track"
          ? (config.tracks as string[] | undefined)?.length
            ? (config.tracks as string[])
            : ["Open"]
          : (q.options ?? []);
      const r = await apiJson(`/api/events/${eventId}/questions`, "POST", {
        label: q.label,
        kind: q.kind,
        options,
        required: q.required,
      });
      if (!r.ok) {
        setQMsg(r.data.error?.message ?? "Couldn't add all of them.");
        return;
      }
      added++;
    }
    setQMsg(
      added
        ? `Added ${added} question${added === 1 ? "" : "s"}. Reload the page to see them under Questions.`
        : "You already ask all of these.",
    );
  }

  if (!kind) return null;

  return (
    <Section n="06" label={kind.name}>
      <div className="o-row">
        <span className="o-label">Setup</span>
        <div>
          <p className="o-meta" style={{ marginBottom: 4 }}>
            {kind.blurb}{" "}
            <span
              aria-live="polite"
              style={{
                color: saved === "error" ? "var(--accent-ink)" : undefined,
              }}
            >
              {saved === "saving"
                ? "Saving…"
                : saved === "saved"
                  ? "Saved."
                  : saved === "error"
                    ? "Didn't save. Check your connection."
                    : ""}
            </span>
          </p>
        </div>
      </div>
      {kind.fields.map((f) => (
        <div className="o-row" key={f.key}>
          <span className="o-label">{f.label}</span>
          <div>
            <FieldInput
              key={`${f.key}:${ver}`}
              field={f}
              value={config[f.key]}
              onChange={(v) => update(f.key, v)}
            />
            {"hint" in f && f.hint && (
              <p className="o-meta" style={{ marginTop: 6 }}>
                {f.hint}
              </p>
            )}
          </div>
        </div>
      ))}
      {kind.questions.length > 0 && (
        <div className="o-row">
          <span className="o-label">Ask at sign-up</span>
          <div>
            <p className="o-meta" style={{ marginBottom: 8 }}>
              {kind.questions.map((q) => q.label).join(", ")}
            </p>
            <Button onClick={addQuestions}>Add these questions</Button>
            {qMsg && (
              <p className="o-meta" role="status" style={{ marginTop: 8 }}>
                {qMsg}
              </p>
            )}
          </div>
        </div>
      )}
    </Section>
  );
}

function FieldInput({
  field: f,
  value,
  onChange,
}: {
  field: Field;
  value: CategoryConfig[string] | undefined;
  onChange: (v: CategoryConfig[string] | undefined) => void;
}) {
  const [draft, setDraft] = useState("");

  if (f.type === "range") {
    const [a, b] =
      Array.isArray(value) && value.length === 2
        ? (value as [number, number])
        : [f.min, f.min];
    const num = (v: number, set: (n: number) => void, label: string) => (
      <input
        aria-label={label}
        type="number"
        className="o-input o-mono"
        style={{ width: 84 }}
        min={f.min}
        max={f.max}
        value={v}
        onChange={(e) => set(Number(e.target.value))}
      />
    );
    return (
      <div className="o-inline" style={{ gap: 8 }}>
        {num(a, (n) => onChange([n, Math.max(n, b)]), `${f.label} from`)}
        <span className="o-meta">to</span>
        {num(b, (n) => onChange([Math.min(a, n), n]), `${f.label} up to`)}
        <span className="o-meta">{f.unit}</span>
        {Array.isArray(value) && (
          <button
            type="button"
            className="o-link"
            style={{ fontSize: 12.5 }}
            onClick={() => onChange(undefined)}
          >
            Clear
          </button>
        )}
      </div>
    );
  }

  if (f.type === "tags") {
    const tags = Array.isArray(value) ? (value as string[]) : [];
    const toggle = (t: string) =>
      onChange(
        tags.includes(t)
          ? tags.filter((x) => x !== t)
          : tags.length < f.max
            ? [...tags, t]
            : tags,
      );
    const custom = tags.filter((t) => !f.suggestions.includes(t));
    return (
      <div>
        <div className="o-chips" role="group" aria-label={f.label}>
          {[...f.suggestions, ...custom].map((t) => (
            <button
              key={t}
              type="button"
              className="o-chip"
              aria-pressed={tags.includes(t)}
              onClick={() => toggle(t)}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="o-inline" style={{ marginTop: 8 }}>
          <input
            aria-label={`Add ${f.label.toLowerCase()}`}
            className="o-input"
            placeholder="Add your own"
            maxLength={40}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && draft.trim()) {
                e.preventDefault();
                if (!tags.includes(draft.trim()) && tags.length < f.max)
                  onChange([...tags, draft.trim()]);
                setDraft("");
              }
            }}
          />
        </div>
      </div>
    );
  }

  if (f.type === "choice") {
    return (
      <div className="o-chips" role="radiogroup" aria-label={f.label}>
        {f.options.map(([v, l]) => (
          <button
            key={v}
            type="button"
            role="radio"
            className="o-chip"
            aria-checked={value === v}
            onClick={() => onChange(value === v ? undefined : v)}
          >
            {l}
          </button>
        ))}
      </div>
    );
  }

  if (f.type === "toggle") {
    return (
      <label className="o-inline" style={{ fontSize: 14 }}>
        <input
          type="checkbox"
          checked={value === true}
          onChange={(e) => onChange(e.target.checked ? true : undefined)}
        />{" "}
        Yes
      </label>
    );
  }

  if (f.type === "lines") {
    return (
      <textarea
        aria-label={f.label}
        className="o-input"
        rows={Math.min(5, f.max)}
        placeholder={f.placeholder}
        defaultValue={typeof value === "string" ? value : ""}
        onBlur={(e) => onChange(e.target.value.trim() || undefined)}
        style={{
          height: "auto",
          paddingTop: 10,
          paddingBottom: 10,
          lineHeight: 1.5,
        }}
      />
    );
  }

  return (
    <input
      aria-label={f.label}
      className="o-input"
      placeholder={f.placeholder}
      maxLength={f.max}
      defaultValue={typeof value === "string" ? value : ""}
      onBlur={(e) => onChange(e.target.value.trim() || undefined)}
    />
  );
}
