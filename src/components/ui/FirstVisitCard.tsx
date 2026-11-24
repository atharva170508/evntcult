"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

/**
 * Dismissible first-visit editorial insert card (Luma teardown #8).
 * Hairline-divided columns, no eyebrow clutter, persisted in localStorage.
 */
export function FirstVisitCard({
  storageKey,
  title,
  steps,
}: {
  storageKey: string;
  eyebrow?: string;
  title: string;
  steps: { num: string; label: string; detail: string }[];
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(storageKey)) setVisible(true);
    } catch {
      // private mode
    }
  }, [storageKey]);

  if (!visible) return null;

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(storageKey, "1");
    } catch {
      // ignore
    }
  };

  return (
    <section
      aria-label={title}
      className="relative rounded-2xl border border-line-strong bg-surface p-6 shadow-card"
    >
      <div className="flex items-start justify-between gap-4 border-b border-line pb-4">
        <h2 className="font-display text-[28px] leading-tight text-ink">
          {title}
        </h2>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss welcome guide"
          className="grid size-8 shrink-0 place-items-center rounded-full text-ink-muted transition-colors hover:bg-sunken hover:text-ink"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
      <ol className="mt-4 grid divide-y divide-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {steps.map((s) => (
          <li key={s.num} className="py-3 first:pt-0 last:pb-0 sm:px-5 sm:py-0 sm:first:pl-0 sm:last:pr-0">
            <span className="font-mono text-[11px] font-medium text-ink-subtle">{s.num}</span>
            <p className="mt-1 text-[14.5px] font-semibold text-ink">{s.label}</p>
            <p className="mt-1 text-[13.5px] leading-relaxed text-ink-muted">{s.detail}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
