import { Users } from "lucide-react";
import { cn } from "@/lib/utils";

/** "184 going" — a real count from registrations, set in tabular mono. */
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
    <span className={cn("inline-flex items-center gap-1.5 text-[13px]", onDark ? "text-white/85" : "text-ink-muted", className)}>
      <Users className="size-3.5" aria-hidden />
      <span className={cn("font-mono font-medium tabular-nums", onDark ? "text-white" : "text-ink")}>{count.toLocaleString("en-IN")}</span>
      {label}
    </span>
  );
}
