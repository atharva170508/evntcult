import { cn } from "@/lib/utils";
import { Entrance } from "@/components/motion/MaskedLines";

/**
 * Editorial Page Masthead: monumental Cormorant Garamond italic heading,
 * champagne-gold bottom accent rule, quiet metadata and actions on the right.
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
    <header
      className={cn(
        "flex flex-wrap items-end justify-between gap-x-8 gap-y-5 border-b border-line pb-7 pt-6 md:pb-8 md:pt-8",
        className,
      )}
    >
      <Entrance delay={0.04} className="min-w-0 max-w-3xl">
        {eyebrow && <p className="tr-meta mb-2 text-[#D4B87A]">{eyebrow}</p>}
        <h1 className="font-display text-[clamp(40px,5.2vw,68px)] font-bold italic leading-[0.94] tracking-[-0.02em] text-ink">
          {title}
        </h1>
        {sub && <div className="mt-2.5 text-[15px] font-light text-ink-muted">{sub}</div>}
      </Entrance>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </header>
  );
}
