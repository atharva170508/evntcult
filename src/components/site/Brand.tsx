import { cn } from "@/lib/utils";

/** Minimal editorial single-stroke pass seal for compact marks. */
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
        tone === "white" ? "text-[#EFEAE0]" : tone === "ink" ? "text-[#161820]" : "text-[#D4B87A]",
        className,
      )}
      aria-hidden
    >
      <circle cx="14" cy="14" r="11" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="14" cy="14" r="4" stroke="currentColor" strokeWidth="1.4" />
      <path d="M14 3v4M14 21v4M3 14h4M21 14h4" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

/** Cormorant Garamond italic luxury wordmark in champagne gold. */
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
        "inline-flex items-baseline font-display font-semibold italic tracking-[-0.015em] leading-none",
        tone === "white" ? "text-[#D4B87A]" : tone === "ink" ? "text-[#161820]" : "text-[#D4B87A]",
        className,
      )}
    >
      EvntCult
    </span>
  );
}

/** App icon tile: deep charcoal square with champagne gold rotary pass emblem. */
export function BrandTile({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={cn("shrink-0", className)} role="img" aria-label="EvntCult">
      <rect width="64" height="64" rx="14" fill="#161820" />
      <rect x="0.75" y="0.75" width="62.5" height="62.5" rx="13.25" stroke="#D4B87A" strokeOpacity="0.28" strokeWidth="1.5" />
      <circle cx="32" cy="32" r="17" stroke="#D4B87A" strokeWidth="1.6" />
      <circle cx="32" cy="32" r="6" stroke="#D4B87A" strokeWidth="1.6" />
      <path d="M32 15v6M32 43v6M15 32h6M43 32h6" stroke="#D4B87A" strokeWidth="1.6" />
    </svg>
  );
}
