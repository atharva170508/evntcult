import { cn } from "@/lib/utils";

/**
 * Editorial page header used at the top of every app page: mono eyebrow, display title
 * (wrap one word in <em> for the serif accent), optional sub line, actions aligned to the
 * baseline, and a hairline to close the header.
 *
 * `marquee` is accepted for backwards compatibility and intentionally ignored.
 */
export function PageHero({
  eyebrow,
  title,
  sub,
  actions,
  className,
}: {
  eyebrow: React.ReactNode;
  title: React.ReactNode;
  sub?: React.ReactNode;
  actions?: React.ReactNode;
  marquee?: string[];
  className?: string;
}) {
  return (
    <header className={cn("animate-fade-up border-b border-line pb-8 pt-6 md:pb-10 md:pt-10", className)}>
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
        <div className="min-w-0 max-w-3xl">
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="mt-3 text-display-lg font-semibold text-ink">{title}</h1>
          {sub && <div className="mt-3 max-w-prose text-lead text-ink-muted">{sub}</div>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
