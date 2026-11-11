import { cn } from "@/lib/utils";

/** "184 going" — a real count from the registrations table (no invented faces). */
export function Avatars({ count, label = "going", className, onDark }: { id?: string; count: number; label?: string; size?: number; className?: string; onDark?: boolean }) {
  return (
    <span className={cn("font-mono text-label tabular-nums", onDark ? "text-ink" : "text-ink-muted", className)}>
      {count.toLocaleString("en-IN")} {label}
    </span>
  );
}
