import { cn } from "@/lib/utils";

/**
 * The EvntCult mark: a pass, with its two side notches and the perforation where the
 * stub tears off.
 */
const PASS = "M7 7H25A4 4 0 0 1 29 11V13A3 3 0 0 0 29 19V21A4 4 0 0 1 25 25H7A4 4 0 0 1 3 21V19A3 3 0 0 0 3 13V11A4 4 0 0 1 7 7Z";

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("shrink-0", className)} aria-hidden>
      <path d={PASS} fill="#E3264F" />
      <path d="M21.5 9.5V22.5" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeDasharray="0.1 3.1" />
    </svg>
  );
}

/** Mark + wordmark, both in brand red. Size it with a text size on `className`. */
export function BrandLogo({ className, tone = "brand" }: { className?: string; tone?: "brand" | "ink" | "white" }) {
  return (
    <span className={cn("inline-flex items-center gap-[0.32em] leading-none", className)}>
      <BrandMark className="size-[1.3em]" />
      <span className={cn("font-sans font-[780] tracking-[-0.045em]", tone === "white" ? "text-white" : tone === "ink" ? "text-ink" : "text-accent")}>evntcult</span>
      <span className="sr-only">EvntCult</span>
    </span>
  );
}

/** App icon: a white pass on a red tile. */
export function BrandTile({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn("shrink-0", className)} role="img" aria-label="EvntCult">
      <rect width="64" height="64" rx="15" fill="#E3264F" />
      <g transform="translate(12 12) scale(1.25)">
        <path d={PASS} fill="#fff" />
        <path d="M21.5 9.5V22.5" stroke="#E3264F" strokeWidth="1.7" strokeLinecap="round" strokeDasharray="0.1 3.1" />
      </g>
    </svg>
  );
}
