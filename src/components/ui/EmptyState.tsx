import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { LinkButton } from "./Button";

/** "Nothing here yet", with the one next step that fixes it. */
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
    <div
      className={cn(
        "flex flex-col items-center rounded-card border border-dashed border-line-strong px-6 py-10 text-center",
        className,
      )}
    >
      <span
        className="grid size-11 place-items-center rounded-tile bg-surface text-ink-muted shadow-card"
        aria-hidden
      >
        <Icon className="size-5" />
      </span>
      <p className="mt-4 text-h4 font-semibold">{title}</p>
      {body && (
        <p className="mt-1 max-w-xs text-small text-ink-muted">{body}</p>
      )}
      {action && (
        <LinkButton
          href={action.href}
          size="sm"
          variant="secondary"
          className="mt-5"
        >
          {action.label}
        </LinkButton>
      )}
    </div>
  );
}
