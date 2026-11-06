import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** A friendly "nothing here yet" box with an optional next step. */
export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  body?: string;
  action?: { label: string; href: string };
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line-strong px-5 py-8 text-center", className)}>
      <span className="grid size-11 place-items-center rounded-2xl bg-canvas text-ink-muted" aria-hidden>
        <Icon className="size-5" />
      </span>
      <p className="text-[15px] font-bold">{title}</p>
      {body && <p className="max-w-xs text-[13px] text-ink-muted">{body}</p>}
      {action && (
        <Link href={action.href} className="mt-1 rounded-full bg-ink px-4 py-2 text-[13px] font-semibold text-ink-inverse hover:bg-ink-2">
          {action.label}
        </Link>
      )}
    </div>
  );
}
