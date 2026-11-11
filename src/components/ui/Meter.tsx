import { cn } from "@/lib/utils";

/** Capacity bar. Ink when there's room; amber past 85%, red when full — always next to a number. */
export function Meter({ value, max, className }: { value: number; max: number | null; className?: string }) {
  const pct = max ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const color = pct >= 100 ? "bg-bad" : pct >= 85 ? "bg-warn" : "bg-ink-muted";
  return (
    <div className={cn("h-1 w-full overflow-hidden rounded-sm bg-surface-3", className)} role="meter" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max ?? undefined} aria-label="Seats taken">
      <div className={cn("h-full", color)} style={{ width: `${pct}%` }} />
    </div>
  );
}
