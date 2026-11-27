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
  primary: "bg-ink text-canvas hover:opacity-90",
  accent:
    "whitespace-nowrap bg-[#D4B87A] text-[#161820] hover:bg-[#E0C78E]",
  secondary:
    "border border-line-strong bg-transparent text-ink hover:border-[#D4B87A] hover:text-[#D4B87A]",
  ghost: "text-ink-muted hover:bg-surface hover:text-ink",
  soft: "border border-line bg-surface text-ink hover:border-line-strong",
  danger:
    "border border-line-strong bg-surface text-danger hover:bg-danger-soft",
  light: "bg-[#EFEAE0] text-[#161820] hover:bg-[#EFEAE0]/90",

  volt: "whitespace-nowrap bg-[#D4B87A] text-[#161820] hover:bg-[#E0C78E]",
  brand: "whitespace-nowrap bg-[#D4B87A] text-[#161820] hover:bg-[#E0C78E]",
  glass: "border border-line bg-surface text-ink hover:border-line-strong",
} as const;

const sizes = {
  sm: "h-9 gap-1.5 rounded-[8px] px-3.5 text-[13px]",
  md: "h-11 gap-2 rounded-[8px] px-5 text-[14px]",
  lg: "h-12 gap-2 rounded-full px-6 text-[15px]",
} as const;

export type ButtonVariant = keyof typeof variants;
export type ButtonSize = keyof typeof sizes;

export const buttonClass = (
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string,
) =>
  cn(
    "relative inline-flex select-none items-center justify-center whitespace-nowrap font-medium",
    "ui-press",
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
