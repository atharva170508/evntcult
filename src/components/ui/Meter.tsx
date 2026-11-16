import { cn } from "@/lib/utils";

/** Capacity bar. Ink while there's room, amber past 85%, red when full (always paired with a number). */
export function Meter({ value, max, className }: { value: number; max: number | null; className?: string }) {
  const pct = max ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const color = pct >= 100 ? "bg-danger" : pct >= 85 ? "bg-warn" : "bg-ink";
  return (
    <div
      className={cn("h-1 w-full overflow-hidden rounded-full bg-sunken", className)}
      role="meter"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max ?? undefined}
      aria-label={max ? `${value} of ${max} taken` : `${value} taken`}
    >
      <div className={cn("h-full origin-left rounded-full transition-[width] duration-1000 ease-out", color)} style={{ width: `${pct}%` }} />
    </div>
  );
}
