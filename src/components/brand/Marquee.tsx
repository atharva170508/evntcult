import { cn } from "@/lib/utils";

/** Slow horizontal ticker of words, separated by the signal caret. Decorative: the same text is on the page for screen readers. */
export function Marquee({ words, className }: { words: string[]; className?: string }) {
  const run = (
    <span className="flex shrink-0 items-center gap-10 pr-10">
      {words.map((w, i) => (
        <span key={i} className="flex items-center gap-10">
          <span>{w}</span>
          <span className="inline-block h-[0.7em] w-[0.08em] rounded-[1px] bg-accent" />
        </span>
      ))}
    </span>
  );
  return (
    <div aria-hidden className={cn("pointer-events-none select-none overflow-hidden whitespace-nowrap [mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)]", className)}>
      <div className="flex w-max motion-safe:animate-marquee">
        {run}
        {run}
      </div>
    </div>
  );
}
