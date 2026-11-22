import Link from "next/link";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Buttons. Anatomy: 8/12/14px corners by size, semibold label, a soft light that follows the
 * cursor (ui-sheen), a 1px lift on hover and a 0.975 press (ui-press). Add `rounded-full` for pills.
 * `accent` is the call to action: lavender with a 2px dark outline (Register, Sign up, Create).
 * `primary` is solid dark; `secondary` is white with a dark outline.
 */
const variants = {
  primary: "bg-ink text-white hover:bg-black",
  accent:
    "whitespace-nowrap bg-lavender text-ink ring-2 ring-inset ring-ink hover:bg-lavender-hover",
  secondary: "bg-surface text-ink ring-1 ring-inset ring-ink hover:bg-sunken",
  ghost: "text-ink-2 hover:bg-sunken hover:text-ink",
  soft: "bg-sunken text-ink hover:bg-mist",
  danger:
    "bg-surface text-danger ring-1 ring-inset ring-line-strong hover:bg-danger-soft",
  /** White button for use on posters and dark bands. */
  light: "bg-white text-ink hover:bg-white/90",

  /* legacy names → new anatomy */
  volt: "whitespace-nowrap bg-lavender text-ink ring-2 ring-inset ring-ink hover:bg-lavender-hover",
  brand:
    "whitespace-nowrap bg-lavender text-ink ring-2 ring-inset ring-ink hover:bg-lavender-hover",
  glass:
    "bg-surface text-ink ring-1 ring-inset ring-line-strong hover:bg-sunken",
} as const;

const sizes = {
  sm: "h-8 gap-1.5 rounded-[9px] px-3 text-[13px]",
  md: "h-10 gap-2 rounded-[12px] px-4 text-[14px]",
  lg: "h-12 gap-2 rounded-[14px] px-6 text-[16px]",
} as const;

export type ButtonVariant = keyof typeof variants;
export type ButtonSize = keyof typeof sizes;

export const buttonClass = (
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string,
) =>
  cn(
    "relative inline-flex select-none items-center justify-center whitespace-nowrap font-semibold",
    "ui-press ui-sheen",
    "disabled:pointer-events-none disabled:opacity-45 aria-disabled:pointer-events-none aria-disabled:opacity-45",
    variants[variant],
    sizes[size],
    className,
  );

export function LinkButton({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: React.ReactNode;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "className">) {
  return (
    <Link
      href={href}
      className={buttonClass(variant, size, className)}
      {...rest}
    >
      {children}
    </Link>
  );
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className,
  children,
  disabled,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}) {
  return (
    <button
      className={buttonClass(variant, size, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && (
        <span className="absolute inset-0 grid place-items-center">
          <Loader2 className="size-4 animate-spin" aria-hidden />
        </span>
      )}
      <span
        className={cn(
          "inline-flex items-center gap-[inherit]",
          loading && "invisible",
        )}
      >
        {children}
      </span>
    </button>
  );
}
