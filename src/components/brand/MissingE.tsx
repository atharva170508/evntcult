/**
 * Compatibility exports: older screens import the logo from here. Everything renders the
 * Concourse brand from components/site/Brand.
 */
import { BrandLogo, BrandMark, BrandTile } from "@/components/site/Brand";

export const LOGO_ACCENT = "#E3264F";

type Motion = "blink" | "still" | "type";

export function LogoWordmark({ className }: { className?: string; motion?: Motion }) {
  return <BrandLogo className={className} />;
}

export function LogoMark({ className = "size-8" }: { className?: string }) {
  return <BrandMark className={className} />;
}

export function LogoIcon({ className = "size-9" }: { className?: string; blink?: boolean }) {
  return <BrandTile className={className} />;
}
