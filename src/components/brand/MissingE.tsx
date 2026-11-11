"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

/**
 * EvntCult logo — "the missing e".
 *
 * The name drops the e from "event": a lime bar sits in the gap between v and n, where the e would go.
 * It is still. Nothing on the page animates unless the person caused it (master prompt §2, law 8).
 * `motion` is accepted for older callers and ignored.
 */
export const LOGO_ACCENT = "var(--accent)";

export function LogoWordmark({ className }: { className?: string; motion?: "type" | "blink" | "still" }) {
  // Plain inline text (not flex), so the bar sits on the letters' baseline like a text cursor.
  return (
    <span role="img" aria-label="EvntCult" className={cn("inline-block whitespace-nowrap font-logo font-semibold leading-none", className)}>
      <span aria-hidden>ev</span>
      <span aria-hidden className="mx-[0.035em] inline-block h-[0.74em] w-[0.08em] rounded-[0.03em] align-[-0.02em]" style={{ background: LOGO_ACCENT }} />
      <span aria-hidden>ntcult</span>
    </span>
  );
}

const RING = "M15.5 6.5H26.5A12 12 0 0 1 38.5 18.5V29.5A12 12 0 0 1 26.5 41.5H15.5A12 12 0 0 1 3.5 29.5V18.5A12 12 0 0 1 15.5 6.5Z";

/** The image mark: a squared c with the e's bar falling out of it (evnt + cult). */
function MarkPaths({ color }: { color: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <>
      <defs>
        <mask id={id} maskUnits="userSpaceOnUse" x="-10" y="-10" width="68" height="68">
          <rect x="-10" y="-10" width="68" height="68" fill="white" />
          <rect x="24" y="15" width="30" height="18" fill="black" transform="rotate(10 21 24)" />
        </mask>
      </defs>
      <path d={RING} fill="none" style={{ stroke: color }} strokeWidth="7" mask={`url(#${id})`} />
      <path d="M10 24H47" fill="none" style={{ stroke: color }} strokeWidth="6" transform="rotate(10 21 24)" />
    </>
  );
}

/** The mark on its own, in the text colour. */
export function LogoMark({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} role="img" aria-label="EvntCult" fill="none">
      <MarkPaths color="currentColor" />
    </svg>
  );
}

/** Square icon for tight spots and the tab: the mark on lime. */
export function LogoIcon({ className = "size-9" }: { className?: string; blink?: boolean }) {
  return (
    <svg viewBox="-8 -8 64 64" className={className} role="img" aria-label="EvntCult">
      <rect x="-8" y="-8" width="64" height="64" rx="8" style={{ fill: LOGO_ACCENT }} />
      <MarkPaths color="var(--accent-ink)" />
    </svg>
  );
}
