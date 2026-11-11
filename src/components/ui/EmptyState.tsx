import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonClass } from "./Button";

/** §8 empty state: a sentence and an action. `icon` is accepted for older callers and ignored. */
export function EmptyState({ title, body, action, className }: { icon?: unknown; title: string; body?: string; action?: { label: string; href: string }; className?: string }) {
  return (
    <div className={cn("flex flex-col items-start gap-2 border-y border-line py-8", className)}>
      <p className="text-body font-semibold">{title}</p>
      {body && <p className="max-w-prose text-body-sm text-ink-muted">{body}</p>}
      {action && (
        <Link href={action.href} className={buttonClass("secondary", "sm", "mt-2")}>
          {action.label}
        </Link>
      )}
    </div>
  );
}
