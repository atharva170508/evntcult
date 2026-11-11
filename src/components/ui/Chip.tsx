import { cn } from "@/lib/utils";

/** Status labels always carry words, so colour is never the only signal (§2 law 10). */
const tones = {
  neutral: "border-line text-ink-muted",
  accent: "border-accent/40 text-accent",
  live: "border-ok/40 text-ok",
  volt: "border-accent/40 text-accent",
  warn: "border-warn/40 text-warn",
  danger: "border-bad/40 text-bad",
  violet: "border-line text-ink-muted",
  dark: "border-accent bg-accent text-accent-ink",
  white: "border-line-strong bg-surface-2 text-ink",
  outline: "border-line text-ink-muted",
} as const;

export type ChipTone = keyof typeof tones;

/** Small mono label for status and counts. `pulse` shows a still live dot. */
export function Chip({ tone = "neutral", pulse, className, children }: { tone?: ChipTone; pulse?: boolean; className?: string; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex h-6 items-center gap-1 rounded-sm border px-2 font-mono text-caption leading-none", tones[tone], className)}>
      {pulse && <span className="size-1 rounded-full bg-accent" aria-hidden />}
      {children}
    </span>
  );
}
