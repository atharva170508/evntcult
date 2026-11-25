import { useId } from "react";
import { cn } from "@/lib/utils";

/**
 * The EvntCult Precision Pass Emblem:
 * Three notched admission passes fanned from a shared pivot, separated by true SVG-mask
 * negative-space knockouts (so it sits cleanly on any background — cream, obsidian, or colored
 * event passes). On hover, the three blades smoothly fan open.
 */
// Sculpted vertical admission pass with a crisp semicircular notch on the right edge
const NOTCHED_BLADE =
  "M3.5 2H17.5A3 3 0 0 1 20.5 5V10.6A2.6 2.6 0 0 0 20.5 15.8V21.5A3 3 0 0 1 17.5 24.5H3.5A3 3 0 0 1 0.5 21.5V5A3 3 0 0 1 3.5 2Z";

export function BrandMark({
  className,
  tone,
}: {
  className?: string;
  tone?: "brand" | "ink" | "white";
}) {
  const uid = useId().replace(/:/g, "");
  const mBack = `ec-mb-${uid}`;
  const mMid = `ec-mm-${uid}`;
  const mFront = `ec-mf-${uid}`;

  const midFill = tone === "white" ? "#FFFEF6" : "currentColor";

  return (
    <svg
      viewBox="0 0 40 34"
      className={cn(
        "shrink-0 overflow-visible",
        tone === "white" ? "text-[#FFFEF6]" : "text-ink",
        className,
      )}
      aria-hidden
    >
      <defs>
        {/* True transparent knockout masks between overlapping blades */}
        <mask id={mBack}>
          <rect x="-10" y="-10" width="60" height="54" fill="white" />
          <g transform="translate(10 4.5) rotate(-5 6 22)">
            <path d={NOTCHED_BLADE} fill="black" stroke="black" strokeWidth="2.8" strokeLinejoin="round" />
          </g>
          <g transform="translate(14 5.5) rotate(11 6 22)">
            <path d={NOTCHED_BLADE} fill="black" stroke="black" strokeWidth="2.8" strokeLinejoin="round" />
          </g>
        </mask>

        <mask id={mMid}>
          <rect x="-10" y="-10" width="60" height="54" fill="white" />
          <g transform="translate(14 5.5) rotate(11 6 22)">
            <path d={NOTCHED_BLADE} fill="black" stroke="black" strokeWidth="2.8" strokeLinejoin="round" />
          </g>
        </mask>

        <mask id={mFront}>
          <rect x="-10" y="-10" width="60" height="54" fill="white" />
          {/* Precision geometric admission bars + pivot punch knocked cleanly through the front blade */}
          <g transform="translate(14 5.5) rotate(11 6 22)">
            <rect x="4.5" y="7" width="9.8" height="2.3" rx="1.15" fill="black" />
            <rect x="4.5" y="11.4" width="6.8" height="2.3" rx="1.15" fill="black" />
            <circle cx="6.2" cy="19.6" r="2" fill="black" />
          </g>
        </mask>
      </defs>

      {/* Back blade: signature lavender */}
      <g
        mask={`url(#${mBack})`}
        className="transition-transform duration-300 ease-out group-hover:-rotate-[6deg]"
        style={{ transformOrigin: "12px 26px" }}
      >
        <g transform="translate(6 4) rotate(-20 6 22)">
          <path d={NOTCHED_BLADE} fill="#DBB2FF" />
        </g>
      </g>

      {/* Middle blade: obsidian ink (or warm cream on dark) */}
      <g
        mask={`url(#${mMid})`}
        className="transition-transform duration-300 ease-out group-hover:-rotate-[1deg]"
        style={{ transformOrigin: "16px 26.5px" }}
      >
        <g transform="translate(10 4.5) rotate(-5 6 22)">
          <path d={NOTCHED_BLADE} fill={midFill} />
        </g>
      </g>

      {/* Front blade: brand crimson with true transparent cutouts */}
      <g
        mask={`url(#${mFront})`}
        className="transition-transform duration-300 ease-out group-hover:translate-x-[0.8px] group-hover:rotate-[5deg]"
        style={{ transformOrigin: "20px 27.5px" }}
      >
        <g transform="translate(14 5.5) rotate(11 6 22)">
          <path d={NOTCHED_BLADE} fill="#E3264F" />
        </g>
      </g>
    </svg>
  );
}

/**
 * Mark + architectural lowercase wordmark with crimson editorial stop.
 */
export function BrandLogo({
  className,
  tone = "brand",
}: {
  className?: string;
  tone?: "brand" | "ink" | "white";
}) {
  return (
    <span className={cn("group inline-flex items-center gap-[0.38em] leading-none", className)}>
      <BrandMark tone={tone} className="h-[1.32em] w-[1.56em]" />
      <span
        className={cn(
          "inline-flex items-baseline font-sans font-[850] tracking-[-0.058em]",
          tone === "white" ? "text-[#FFFEF6]" : "text-ink",
        )}
      >
        evntcult
        <span
          aria-hidden
          className="ml-[0.06em] inline-block size-[0.2em] rounded-[2px] bg-[#E3264F]"
        />
      </span>
      <span className="sr-only">EvntCult</span>
    </span>
  );
}

/** App icon: matte obsidian squircle housing the true-knockout 3-blade Pass Emblem. */
export function BrandTile({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn("shrink-0", className)} role="img" aria-label="EvntCult">
      <defs>
        <mask id="ec-tb">
          <rect x="-10" y="-10" width="60" height="54" fill="white" />
          <g transform="translate(10 4.5) rotate(-5 6 22)">
            <path d={NOTCHED_BLADE} fill="black" stroke="black" strokeWidth="2.8" strokeLinejoin="round" />
          </g>
          <g transform="translate(14 5.5) rotate(11 6 22)">
            <path d={NOTCHED_BLADE} fill="black" stroke="black" strokeWidth="2.8" strokeLinejoin="round" />
          </g>
        </mask>
        <mask id="ec-tm">
          <rect x="-10" y="-10" width="60" height="54" fill="white" />
          <g transform="translate(14 5.5) rotate(11 6 22)">
            <path d={NOTCHED_BLADE} fill="black" stroke="black" strokeWidth="2.8" strokeLinejoin="round" />
          </g>
        </mask>
        <mask id="ec-tf">
          <rect x="-10" y="-10" width="60" height="54" fill="white" />
          <g transform="translate(14 5.5) rotate(11 6 22)">
            <rect x="4.5" y="7" width="9.8" height="2.3" rx="1.15" fill="black" />
            <rect x="4.5" y="11.4" width="6.8" height="2.3" rx="1.15" fill="black" />
            <circle cx="6.2" cy="19.6" r="2" fill="black" />
          </g>
        </mask>
      </defs>
      <rect width="64" height="64" rx="16" fill="#141312" />
      <rect x="1" y="1" width="62" height="62" rx="15" fill="none" stroke="#FFFEF6" strokeOpacity="0.1" strokeWidth="1.5" />
      <g transform="translate(7.5 10) scale(1.24)">
        <g mask="url(#ec-tb)">
          <g transform="translate(6 4) rotate(-20 6 22)">
            <path d={NOTCHED_BLADE} fill="#DBB2FF" />
          </g>
        </g>
        <g mask="url(#ec-tm)">
          <g transform="translate(10 4.5) rotate(-5 6 22)">
            <path d={NOTCHED_BLADE} fill="#FFFEF6" />
          </g>
        </g>
        <g mask="url(#ec-tf)">
          <g transform="translate(14 5.5) rotate(11 6 22)">
            <path d={NOTCHED_BLADE} fill="#E3264F" />
          </g>
        </g>
      </g>
    </svg>
  );
}
