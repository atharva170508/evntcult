import { cn } from "@/lib/utils";
import { Aurora } from "./Aurora";
import { Marquee } from "./Marquee";

/**
 * The top of every app page (M7): a dark aurora band, small eyebrow, huge editorial
 * serif title (wrap one word in <em> for the italic accent), optional sub line,
 * actions on the right and faded marquee words behind.
 */
export function PageHero({
  eyebrow,
  title,
  sub,
  actions,
  marquee,
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
    <header className={cn("relative isolate mt-3 overflow-hidden rounded-lg px-6 py-8 md:px-12 md:py-12", className)}>
      <Aurora quiet />
      {marquee && <Marquee words={marquee} className="absolute inset-x-0 bottom-2 text-display text-white/[0.04]" />}
      <div className="relative flex flex-wrap items-end justify-between gap-6">
        <div className="min-w-0 max-w-3xl">
          <p className="eyebrow text-ink-2">{eyebrow}</p>
          <h1 className="title-xl mt-3 text-display">{title}</h1>
          {sub && <div className="mt-3 text-body text-ink-2">{sub}</div>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </header>
  );
}
