import { cn } from "@/lib/utils";

/** Capacity bar. Turns amber past 85% and red when full. */
export function Meter({ value, max, className }: { value: number; max: number | null; className?: string }) {
  const pct = max ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const color = pct >= 100 ? "bg-danger" : pct >= 85 ? "bg-warn" : "bg-brand";
  return (
    <div
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-canvas", className)}
      role="meter"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max ?? undefined}
    >
      <div className={cn("h-full rounded-full transition-[width] duration-large ease-standard", color)} style={{ width: `${pct}%` }} />
    </div>
  );
}
