import { cn } from "@/lib/utils";

const tones = {
  neutral: "bg-sunken text-ink-2",
  outline: "bg-surface text-ink-2 ring-1 ring-inset ring-line",
  accent: "bg-accent-soft text-accent-ink",
  live: "bg-live-soft text-live",
  warn: "bg-warn-soft text-warn",
  danger: "bg-danger-soft text-danger",
  dark: "bg-night text-white",
  white: "bg-white text-ink shadow-[0_1px_2px_rgba(20,22,27,0.12)]",

  /* legacy names */
  volt: "bg-accent-soft text-accent-ink",
  violet: "bg-sunken text-ink-2",
} as const;

export type ChipTone = keyof typeof tones;

/** Small status label. Always carries a word — colour is never the only signal. */
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
        "inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-md px-2 text-[12px] font-semibold leading-none",
        tones[tone],
        className,
      )}
    >
      {pulse && (
        <span
          className="size-1.5 rounded-full bg-live-dot"
          aria-hidden
        />
      )}
      {children}
    </span>
  );
}
