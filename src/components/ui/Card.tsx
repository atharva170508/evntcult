import Link from "next/link";
import { cn } from "@/lib/utils";

interface CardProps {
  /** Editorial section number, "01" (§3), or a short mono label. */
  eyebrow?: string;
  title?: string;
  /** Accepted for older callers; nothing is drawn (§3: no icons). */
  icon?: unknown;
  action?: { label: string; href: string };
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

/** §8 Card — hairline, radius 6, padding 16–24, one dominant element. */
export function Card({ eyebrow, title, action, className, bodyClassName, children, style }: CardProps) {
  return (
    <section className={cn("card flex flex-col overflow-hidden", className)} style={style}>
      {(eyebrow || title || action) && (
        <header className="flex items-start justify-between gap-4 px-4 pt-4 sm:px-6 sm:pt-6">
          <div className="min-w-0">
            {eyebrow && <p className="eyebrow">{eyebrow}</p>}
            {title && <h2 className="truncate text-title text-ink">{title}</h2>}
          </div>
          {action && (
            <Link href={action.href} className="press inline-flex h-8 shrink-0 items-center gap-1 rounded-sm px-2 text-label text-ink-muted hover:text-ink">
              {action.label}
              <span aria-hidden>›</span>
            </Link>
          )}
        </header>
      )}
      <div className={cn("flex-1 p-4 sm:p-6", (eyebrow || title) && "pt-3 sm:pt-4", bodyClassName)}>{children}</div>
    </section>
  );
}
