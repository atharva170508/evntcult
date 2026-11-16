import { cn } from "@/lib/utils";

/**
 * Quiet paper backdrop for hero panels: a faint dot grid that fades out toward the edges.
 * (Name kept for older imports.)
 */
export function Aurora({ className }: { className?: string; quiet?: boolean }) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <div className="dot-grid absolute inset-0 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_30%,black,transparent_75%)]" />
    </div>
  );
}
