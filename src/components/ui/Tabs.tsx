"use client";

import Link from "next/link";
import { useId, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * §8 Tabs — 44 tall; the active tab gets a 2px accent underline and heavier weight (never colour alone).
 * Arrow keys move between tabs, Home and End jump to the ends.
 */
const tabClass = (selected: boolean) =>
  cn(
    "relative -mb-px inline-flex h-11 items-center whitespace-nowrap border-b-2 px-1 text-body transition-colors duration-micro",
    selected ? "border-accent font-semibold text-ink" : "border-transparent text-ink-muted hover:text-ink",
  );

function arrowKeys(e: React.KeyboardEvent<HTMLElement>, onMove?: (i: number) => void) {
  const tabs = [...(e.currentTarget.querySelectorAll<HTMLElement>("[role=tab]") ?? [])];
  const i = tabs.indexOf(document.activeElement as HTMLElement);
  if (i < 0) return;
  const to = e.key === "ArrowRight" ? i + 1 : e.key === "ArrowLeft" ? i - 1 : e.key === "Home" ? 0 : e.key === "End" ? tabs.length - 1 : null;
  if (to === null) return;
  e.preventDefault();
  const n = (to + tabs.length) % tabs.length;
  tabs[n].focus();
  onMove?.(n);
}

/** Tabs that switch panels on the same page. */
export function Tabs<T extends string>({ tabs, value, onChange, label, children }: { tabs: readonly (readonly [T, string])[]; value: T; onChange: (v: T) => void; label: string; children: React.ReactNode }) {
  const id = useId();
  return (
    <div>
      <div role="tablist" aria-label={label} className="flex gap-6 border-b border-line" onKeyDown={(e) => arrowKeys(e, (n) => onChange(tabs[n][0]))}>
        {tabs.map(([v, l]) => (
          <button key={v} id={`${id}-${v}`} type="button" role="tab" aria-selected={v === value} aria-controls={`${id}-panel`} tabIndex={v === value ? 0 : -1} className={tabClass(v === value)} onClick={() => onChange(v)}>
            {l}
          </button>
        ))}
      </div>
      <div id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-${value}`} tabIndex={0} className="pt-6 focus-visible:outline-offset-4">
        {children}
      </div>
    </div>
  );
}

/** Tabs that are links (each tab is its own URL). The current one is marked for screen readers too. */
export function LinkTabs({ tabs, current, label }: { tabs: readonly { href: string; label: string; key: string }[]; current: string; label: string }) {
  const ref = useRef<HTMLElement>(null);
  return (
    <nav aria-label={label} ref={ref} className="flex gap-6 border-b border-line" onKeyDown={(e) => arrowKeys(e)}>
      {tabs.map((t) => (
        <Link key={t.key} href={t.href} role="tab" aria-selected={t.key === current} aria-current={t.key === current ? "page" : undefined} className={tabClass(t.key === current)}>
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
