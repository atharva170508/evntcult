import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CardProps {
  eyebrow?: string;
  title?: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: { label: string; href: string };
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

/** Glass card with an optional icon, eyebrow, title and "See all" link. */
export function Card({ eyebrow, title, icon: Icon, action, className, bodyClassName, children, style }: CardProps) {
  return (
    <section className={cn("card flex flex-col overflow-hidden animate-fade-up", className)} style={style}>
      {(eyebrow || title || action) && (
        <header className="flex items-center justify-between gap-4 px-6 pt-6">
          <div className="flex min-w-0 items-center gap-3">
            {Icon && (
              <span className="grid size-10 shrink-0 place-items-center rounded-2xl border border-volt/20 bg-volt/10 text-volt">
                <Icon className="size-[18px]" />
              </span>
            )}
            <div className="min-w-0">
              {eyebrow && <p className="eyebrow">{eyebrow}</p>}
              {title && <h2 className="truncate font-display text-[21px] font-bold leading-[1.1] tracking-[-0.02em] text-ink">{title}</h2>}
            </div>
          </div>
          {action && (
            <Link
              href={action.href}
              className="group inline-flex shrink-0 items-center rounded-full border border-line px-3 py-1.5 text-[12.5px] font-semibold text-ink-2 transition-colors hover:border-volt hover:bg-volt hover:text-ink-inverse"
            >
              {action.label}
              <ChevronRight className="ml-0.5 size-3.5 transition-transform duration-300 ease-apple group-hover:translate-x-0.5" />
            </Link>
          )}
        </header>
      )}
      <div className={cn("flex-1 p-6", (eyebrow || title) && "pt-4", bodyClassName)}>{children}</div>
    </section>
  );
}
