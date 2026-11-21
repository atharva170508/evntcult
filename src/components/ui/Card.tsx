import Link from "next/link";
import { ArrowRight } from "lucide-react";
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
  as?: "section" | "div" | "article";
}

/** Paper card: optional mono eyebrow, title and a quiet "See all →" link. */
export function Card({
  eyebrow,
  title,
  icon: Icon,
  action,
  className,
  bodyClassName,
  children,
  style,
  as: Tag = "section",
}: CardProps) {
  const hasHeader = !!(eyebrow || title || action);
  return (
    <Tag className={cn("card flex flex-col", className)} style={style}>
      {hasHeader && (
        <header className="flex items-start justify-between gap-4 px-5 pt-5 md:px-6 md:pt-6">
          <div className="flex min-w-0 items-center gap-3">
            {Icon && (
              <span className="grid size-9 shrink-0 place-items-center rounded-tile bg-sunken text-ink-2">
                <Icon className="size-[17px]" />
              </span>
            )}
            <div className="min-w-0">
              {eyebrow && <p className="eyebrow">{eyebrow}</p>}
              {title && (
                <h2 className="mt-0.5 truncate text-h4 font-semibold text-ink">
                  {title}
                </h2>
              )}
            </div>
          </div>
          {action && (
            <Link
              href={action.href}
              className="group -mr-2 inline-flex shrink-0 items-center gap-1 rounded-xl px-2.5 py-1.5 text-[13px] font-medium text-ink-muted transition-colors duration-fast hover:bg-ink/[0.05] hover:text-ink"
            >
              {action.label}
              <ArrowRight
                className="size-3.5 transition-transform duration-base ease-out group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
          )}
        </header>
      )}
      <div
        className={cn(
          "flex-1 p-5 md:p-6",
          hasHeader && "pt-4 md:pt-4",
          bodyClassName,
        )}
      >
        {children}
      </div>
    </Tag>
  );
}
