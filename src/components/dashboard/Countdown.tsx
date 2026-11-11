"use client";

import { useEffect, useState } from "react";

/**
 * "2d 04h 12m" in mono, refreshed once a minute. Plain text that changes — nothing flips or ticks
 * on its own (§2 law 8). Shows "Happening now" between start and end.
 */
export function Countdown({ to, endsAt }: { to: Date; endsAt: Date; compact?: boolean }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);
  if (now === null) return <span className="font-mono text-body-sm text-ink-subtle">—</span>; // avoids a hydration mismatch
  if (now >= +endsAt) return <span className="font-mono text-body-sm text-ink-muted">Ended</span>;
  if (now >= +to) return <span className="font-mono text-body-sm font-medium text-ok">● Happening now</span>;
  const mins = Math.max(0, Math.floor((+to - now) / 60_000));
  const d = Math.floor(mins / 1440), h = Math.floor((mins % 1440) / 60), m = mins % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return <span className="font-mono text-body-sm tabular-nums">{d > 0 ? `${d}d ${pad(h)}h ${pad(m)}m` : `${pad(h)}h ${pad(m)}m`}</span>;
}
