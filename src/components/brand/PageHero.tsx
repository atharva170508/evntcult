import { cn } from "@/lib/utils";

/**
 * The top of every app page: a mono eyebrow (often the editorial number, §3), the page title,
 * an optional line under it, and actions on the right. A hairline closes it. No art behind.
 * `marquee` is accepted for older callers and ignored.
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
    <header className={cn("flex flex-wrap items-end justify-between gap-6 border-b border-line pb-6 pt-8", className)}>
      <div className="min-w-0 max-w-prose">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="title-xl mt-2">{title}</h1>
        {sub && <div className="mt-2 text-body text-ink-muted">{sub}</div>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}
