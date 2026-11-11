"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}

/** Live countdown in little boxes (Unstop / Devfolio idea); "Happening now" once started. */
export function Countdown({ to, endsAt, compact }: { to: Date; endsAt: Date; compact?: boolean }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (now === null) return <div className={compact ? "h-[44px]" : "h-[62px]"} />; // avoid hydration mismatch

  if (now >= +to && now < +endsAt) {
    return (
      <p className="inline-flex items-center gap-2 rounded-full bg-volt/10 px-3 py-2 text-body font-semibold text-volt ring-1 ring-volt/30">
        <span className="size-2 rounded-full bg-volt" aria-hidden /> Happening now
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
    <div className="flex items-center gap-2" aria-label={`Starts in ${d} days ${h} hours ${m} minutes`}>
      {cells.map((c, i) => (
        <div key={c.l} className="flex items-center gap-2">
          <div className={cn("rounded-md bg-canvas text-center", compact ? "min-w-[46px] px-2 py-2" : "min-w-[58px] px-3 py-2")}>
            <div className={cn("font-semibold leading-none tabular-nums", compact ? "text-title" : "text-heading")}>
              {String(c.v).padStart(2, "0")}
            </div>
            <div className="mt-1 text-caption font-semibold uppercase tracking-[0.08em] text-ink-subtle">{c.l}</div>
          </div>
          {i < cells.length - 1 && <span className="font-semibold text-ink-subtle">:</span>}
        </div>
      ))}
    </div>
  );
}
