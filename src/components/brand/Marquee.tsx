import { cn } from "@/lib/utils";

/** Giant uppercase words sliding sideways (Local Time-style). Decorative; the same text is in the page for screen readers. */
export function Marquee({ words, className }: { words: string[]; className?: string }) {
  const run = words.map((w) => `${w} · `).join("");
  return (
    <div aria-hidden className={cn("pointer-events-none select-none overflow-hidden whitespace-nowrap", className)}>
      <div className="inline-flex">
        <span className="shout pr-8">{run}</span>
        <span className="shout pr-8">{run}</span>
      </div>
    </div>
  );
}
