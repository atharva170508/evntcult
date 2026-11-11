import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * §8 Button — one family, three heights (32 / 40 / 48), six states
 * (rest, hover, press, focus, disabled, loading). One primary per view.
 * Destructive actions use `danger`: square corners, and keep 24px away from other buttons.
 */
const variants = {
  primary: "border border-accent bg-accent text-accent-ink hover:bg-[color-mix(in_srgb,var(--accent)_90%,var(--text))]",
  secondary: "border border-line-strong bg-transparent text-ink hover:bg-white/[0.04]",
  ghost: "border border-transparent bg-transparent text-ink-muted hover:text-ink",
  danger: "rounded-none border border-bad bg-transparent text-ink hover:bg-bad/10",
} as const;

/** Older names still used around the app, mapped onto the four variants. */
const aliases = { volt: "primary", brand: "primary", glass: "secondary", soft: "secondary", light: "secondary" } as const;

type Variant = keyof typeof variants | keyof typeof aliases;
type Size = "sm" | "md" | "lg";

const sizes: Record<Size, string> = {
  sm: "h-8 rounded-sm px-3 text-label",
  md: "h-10 rounded-md px-4 text-body",
  lg: "h-12 rounded-md px-6 text-body",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  const v = variant in aliases ? aliases[variant as keyof typeof aliases] : (variant as keyof typeof variants);
  return cn(
    "press relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap font-semibold",
    "disabled:cursor-not-allowed disabled:border-line disabled:bg-transparent disabled:text-ink-subtle aria-disabled:pointer-events-none aria-disabled:text-ink-subtle",
    sizes[size],
    variants[v],
    className,
  );
}

export function LinkButton({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: { href: string; variant?: Variant; size?: Size; className?: string; children: React.ReactNode } & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  return (
    <Link href={href} className={buttonClass(variant, size, className)} {...rest}>
      {children}
    </Link>
  );
}

/** While `loading`, the label is kept (invisible) so the width never jumps, and a spinner sits on top. */
export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className,
  children,
  disabled,
  type = "button",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; loading?: boolean }) {
  return (
    <button type={type} className={buttonClass(variant, size, className)} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      <span className={cn("inline-flex items-center gap-2", loading && "invisible")}>{children}</span>
      {loading && (
        <span className="absolute inset-0 grid place-items-center" aria-hidden>
          <span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
        </span>
      )}
    </button>
  );
}
