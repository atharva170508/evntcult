import { Users } from "lucide-react";
import { cn } from "@/lib/utils";

/** "184 going" — a real count from the registrations table (no invented faces). */
export function Avatars({
  count,
  label = "going",
  className,
  onDark,
}: {
  id?: string;
  count: number;
  label?: string;
  size?: number;
  className?: string;
  onDark?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <Users className={cn("size-4", onDark ? "text-white/80" : "text-ink-subtle")} />
      <span className={cn("font-mono text-[12.5px] font-semibold tabular-nums", onDark ? "text-white" : "text-ink-2")}>
        {count.toLocaleString("en-IN")} <span className={cn("font-sans", onDark ? "text-white/75" : "text-ink-muted")}>{label}</span>
      </span>
    </div>
  );
}
