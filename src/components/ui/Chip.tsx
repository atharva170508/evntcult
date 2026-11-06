import { cn } from "@/lib/utils";

const tones = {
  neutral: "bg-canvas text-ink-2",
  accent: "bg-brand-soft text-brand-ink",
  live: "bg-live-soft text-live",
  /** Live / happening-now indicators: the neon-yellow accent. */
  volt: "bg-volt/10 text-volt ring-1 ring-volt/30",
  warn: "bg-warn-soft text-warn",
  danger: "bg-danger-soft text-danger",
  violet: "bg-brand-soft text-brand-ink",
  dark: "bg-volt text-ink-inverse",
  white: "bg-white/90 text-ink-inverse backdrop-blur",
  outline: "border border-line bg-surface text-ink-2",
} as const;

export type ChipTone = keyof typeof tones;

/** Small rounded label (status chips like Devfolio, badges like Eventbrite). */
export function Chip({
  tone = "neutral",
  pulse,
  className,
  children,
}: {
  tone?: ChipTone;
  pulse?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold leading-none",
        tones[tone],
        className,
      )}
    >
      {pulse && <span className="size-1.5 rounded-full bg-volt motion-safe:animate-pulse-dot" aria-hidden />}
      {children}
    </span>
  );
}
