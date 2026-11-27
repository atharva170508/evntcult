import { cn } from "@/lib/utils";
import { Entrance } from "@/components/motion/MaskedLines";

/**
 * Page header: a plain bold title, an optional short line under it, actions on the right.
 * `eyebrow` is kept in the props for older callers but is only announced to screen readers.
 */
export function PageHero({
  eyebrow,
  title,
  sub,
  actions,
  className,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  sub?: React.ReactNode;
  actions?: React.ReactNode;
  marquee?: string[];
  className?: string;
}) {
  return (
    <header className={cn("flex flex-wrap items-end justify-between gap-x-8 gap-y-4 pb-6 pt-8 md:pb-8 md:pt-12", className)}>
      <Entrance delay={0.05} className="min-w-0 max-w-3xl">
        {eyebrow && <p className="sr-only">{eyebrow}</p>}
        <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.02em] text-ink md:text-[32px]">{title}</h1>
        {sub && <div className="mt-1.5 text-[15px] text-ink-muted">{sub}</div>}
      </Entrance>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
