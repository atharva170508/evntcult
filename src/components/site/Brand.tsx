import { cn } from "@/lib/utils";

/** Minimal editorial single-stroke emblem for passes and compact marks. */
export function BrandMark({
  className,
  tone,
}: {
  className?: string;
  tone?: "brand" | "ink" | "white";
}) {
  return (
    <svg
      viewBox="0 0 28 28"
      fill="none"
      className={cn(
        "shrink-0",
        tone === "white" ? "text-[#EEE8DD]" : tone === "ink" ? "text-[#151412]" : "text-[#C9A26B]",
        className,
      )}
      aria-hidden
    >
      <circle cx="14" cy="14" r="11" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="14" cy="14" r="4" stroke="currentColor" strokeWidth="1.5" />
      <path d="M14 3v4M14 21v4M3 14h4M21 14h4" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

/** Editorial wordmark in Gloock serif with quiet archival restraint. */
export function BrandLogo({
  className,
  tone = "brand",
}: {
  className?: string;
  tone?: "brand" | "ink" | "white";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-baseline font-display tracking-[-0.02em] leading-none",
        tone === "white" ? "text-[#EEE8DD]" : tone === "ink" ? "text-[#151412]" : "text-ink",
        className,
      )}
    >
      EVNTCULT
      <span className="sr-only">EvntCult</span>
    </span>
  );
}

/** App icon tile: ink square with single-stroke warm gold rotary seal. */
export function BrandTile({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={cn("shrink-0", className)} role="img" aria-label="EvntCult">
      <rect width="64" height="64" rx="14" fill="#151412" />
      <rect x="0.75" y="0.75" width="62.5" height="62.5" rx="13.25" stroke="#EEE8DD" strokeOpacity="0.18" strokeWidth="1.5" />
      <circle cx="32" cy="32" r="17" stroke="#C9A26B" strokeWidth="1.75" />
      <circle cx="32" cy="32" r="6" stroke="#C9A26B" strokeWidth="1.75" />
      <path d="M32 15v6M32 43v6M15 32h6M43 32h6" stroke="#C9A26B" strokeWidth="1.75" />
    </svg>
  );
}
