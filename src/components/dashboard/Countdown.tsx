"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}

/** Live countdown in tabular mono cells; "Happening now" once started, "Ended" after. */
export function Countdown({ to, endsAt, compact }: { to: Date; endsAt: Date; compact?: boolean }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (now === null) return <div className={compact ? "h-[44px]" : "h-[60px]"} aria-hidden />; // avoid hydration mismatch

  if (now >= +endsAt) {
    return <p className="inline-flex h-8 items-center rounded-xl bg-sunken px-3 text-[13px] font-medium text-ink-muted">Ended</p>;
  }

  if (now >= +to) {
    return (
      <p className="inline-flex h-8 items-center gap-2 rounded-xl bg-accent-soft px-3 text-[13px] font-medium text-accent-ink">
        <span className="size-1.5 rounded-full bg-accent motion-safe:animate-pulse-dot" aria-hidden /> Happening now
      </p>
    );
  }

  const { d, h, m, s } = parts(+to - now);
  const cells = [
    { v: d, l: "days" },
    { v: h, l: "hrs" },
    { v: m, l: "min" },
    { v: s, l: "sec" },
  ];
  return (
    <div role="timer" className="flex items-stretch gap-1" aria-label={`Starts in ${d} days ${h} hours ${m} minutes`}>
      {cells.map((c) => (
        <div key={c.l} className={cn("rounded-xl bg-sunken text-center", compact ? "min-w-[44px] px-1.5 py-1.5" : "min-w-[56px] px-2 py-2")}>
          <div className={cn("font-mono font-medium leading-none tracking-[-0.04em] tabular-nums text-ink", compact ? "text-[17px]" : "text-[22px]")}>
            {String(c.v).padStart(2, "0")}
          </div>
          <div className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-subtle">{c.l}</div>
        </div>
      ))}
    </div>
  );
}
