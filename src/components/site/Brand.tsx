import { cn } from "@/lib/utils";

/**
 * The EvntCult mark: a pass, with its two side notches and the perforation where the
 * stub tears off. Crimson on light surfaces; it keeps its colour on night bands too.
 */
const PASS = "M7 7H25A4 4 0 0 1 29 11V13A3 3 0 0 0 29 19V21A4 4 0 0 1 25 25H7A4 4 0 0 1 3 21V19A3 3 0 0 0 3 13V11A4 4 0 0 1 7 7Z";

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("shrink-0", className)} aria-hidden>
      <path d={PASS} fill="#D9234B" />
      <path d="M21.5 9.5V22.5" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeDasharray="0.1 3.1" />
    </svg>
  );
}

/** Mark + wordmark. Size it with a text size on `className`; the mark follows. */
export function BrandLogo({ className, tone = "ink" }: { className?: string; tone?: "ink" | "white" }) {
  return (
    <span className={cn("inline-flex items-center gap-[0.32em] leading-none", className)}>
      <BrandMark className="size-[1.3em]" />
      <span className={cn("font-sans font-[780] tracking-[-0.045em]", tone === "white" ? "text-white" : "text-ink")}>evntcult</span>
      <span className="sr-only">EvntCult</span>
    </span>
  );
}

/** App icon: the pass on a night tile. */
export function BrandTile({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn("shrink-0", className)} role="img" aria-label="EvntCult">
      <rect width="64" height="64" rx="15" fill="#0B1626" />
      <g transform="translate(12 12) scale(1.25)">
        <path d={PASS} fill="#D9234B" />
        <path d="M21.5 9.5V22.5" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeDasharray="0.1 3.1" />
      </g>
    </svg>
  );
}
