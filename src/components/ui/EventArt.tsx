import { cn } from "@/lib/utils";

/**
 * The ground behind an event without an uploaded banner: the flat ticket colour (§8). No gradients,
 * no invented art (§18). `accent` and `intensity` are accepted for older callers and ignored.
 */
export function EventArt({ className }: { accent?: string; className?: string; intensity?: number }) {
  return <div aria-hidden className={cn("pointer-events-none absolute inset-0 bg-ticket", className)} />;
}
