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
    <div className={cn("flex flex-col items-center gap-2 rounded-md border border-dashed border-line-strong px-6 py-8 text-center", className)}>
      <span className="grid size-11 place-items-center rounded-md bg-canvas text-ink-muted" aria-hidden>
        <Icon className="size-5" />
      </span>
      <p className="text-body font-semibold">{title}</p>
      {body && <p className="max-w-xs text-body-sm text-ink-muted">{body}</p>}
      {action && (
        <Link href={action.href} className="mt-1 rounded-full bg-volt px-4 py-2 text-body-sm font-semibold text-ink-inverse hover:bg-volt-hover">
          {action.label}
        </Link>
      )}
    </div>
  );
}
