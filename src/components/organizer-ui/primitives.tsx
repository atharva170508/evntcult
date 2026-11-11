"use client";

import { useEffect, useId, useState } from "react";
import { ToastView } from "@/components/ui/Toast";

export function Button({ variant = "ghost", className = "", ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "ghost" | "primary" }) {
  return <button type="button" className={`o-btn ${variant === "primary" ? "o-btn-primary" : ""} ${className}`} {...p} />;
}

export function Section({ n, label, children }: { n: string; label: string; children: React.ReactNode }) {
  return (
    <section className="o-section" aria-label={label}>
      <div className="o-section-head">
        <span className="o-section-n">{n}</span>
        <span className="o-section-label">{label}</span>
      </div>
      {children}
    </section>
  );
}

/** A labelled row. `children` receives the id and error wiring for its input. */
export function Field({ label, error, hint, children }: { label: string; error?: string | null; hint?: React.ReactNode; children: (a: { id: string; "aria-invalid": boolean; "aria-describedby"?: string }) => React.ReactNode }) {
  const id = useId();
  const errId = `${id}-err`;
  return (
    <div className="o-row">
      <label className="o-label" htmlFor={id}>
        {label}
      </label>
      <div>
        {children({ id, "aria-invalid": !!error, "aria-describedby": error ? errId : undefined })}
        {error && (
          <p className="o-err" id={errId} role="alert">
            {error}
          </p>
        )}
        {hint && <div className="o-hint">{hint}</div>}
      </div>
    </div>
  );
}

export function Segmented<T extends string>({ value, options, onChange, label, fill }: { value: T; options: readonly (readonly [T, string])[]; onChange: (v: T) => void; label: string; fill?: "accent" }) {
  const i = Math.max(0, options.findIndex(([v]) => v === value));
  const style = fill === "accent" ? ({ "--seg-fill": "var(--accent)", "--seg-text": "var(--ink)" } as React.CSSProperties) : undefined;
  return (
    <div className="o-seg" role="radiogroup" aria-label={label} style={style}>
      <span className="o-seg-thumb" aria-hidden style={{ width: `calc((100% - 4px) / ${options.length})`, transform: `translateX(${i * 100}%)` }} />
      {options.map(([v, l]) => (
        <button key={v} type="button" role="radio" aria-checked={v === value} onClick={() => onChange(v)}>
          {l}
        </button>
      ))}
    </div>
  );
}

/** Digits roll to their new value. Anything that isn't a digit is printed as is. */
export function Odometer({ value }: { value: string }) {
  return (
    <span aria-label={value}>
      {[...value].map((ch, i) =>
        /\d/.test(ch) ? (
          <span key={`${value.length}-${i}`} className="o-odo" aria-hidden>
            <span className="o-odo-col" style={{ transform: `translateY(-${Number(ch)}em)` }}>
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
                <span key={d}>{d}</span>
              ))}
            </span>
          </span>
        ) : (
          <span key={`${value.length}-${i}`} aria-hidden>
            {ch}
          </span>
        ),
      )}
    </span>
  );
}

export type ToastState = { message: string; action?: { label: string; run: () => void } } | null;

/** The shared §8 toast (one at a time, 4–6s, action inside). */
export function Toast({ toast, onDone, ms = 6000 }: { toast: ToastState; onDone: () => void; ms?: number }) {
  return <ToastView toast={toast ? { ...toast, ms } : null} onDone={onDone} />;
}

/** "12s ago", kept ticking. */
export function useAgo(at: number | null) {
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);
  if (!at) return null;
  const s = Math.max(0, Math.round((Date.now() - at) / 1000));
  return s < 60 ? `${s}s ago` : `${Math.round(s / 60)}m ago`;
}

export async function apiJson<T = Record<string, unknown>>(url: string, method: string, body?: unknown) {
  const res = await fetch(url, { method, headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
  const data = (await res.json().catch(() => ({}))) as T & { error?: { code: string; message: string }; missing?: string[]; version?: number };
  return { ok: res.ok, status: res.status, data };
}
