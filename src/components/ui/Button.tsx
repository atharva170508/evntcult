import Link from "next/link";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Buttons. Anatomy: pill, 1px inner top highlight on filled variants, 0.98 press,
 * 160ms colour transitions. `primary` is ink — use `accent` for the single most
 * important action on a screen (Register, Sign up).
 */
const variants = {
  primary: "bg-ink text-white shadow-button hover:bg-[#2a2a28]",
  accent: "bg-accent text-white shadow-accent hover:bg-accent-hover",
  secondary: "bg-surface text-ink shadow-card hover:shadow-raised hover:bg-surface",
  ghost: "text-ink-2 hover:bg-ink/[0.05] hover:text-ink",
  soft: "bg-sunken text-ink hover:bg-[#E5E2DB]",
  danger: "bg-surface text-danger shadow-card hover:bg-danger-soft",
  /** White pill for use on posters and dark photos. */
  light: "bg-white text-ink shadow-button hover:bg-white/90",

  /* legacy names → new anatomy */
  volt: "bg-accent text-white shadow-accent hover:bg-accent-hover",
  brand: "bg-accent text-white shadow-accent hover:bg-accent-hover",
  glass: "bg-surface text-ink shadow-card hover:shadow-raised",
} as const;

const sizes = {
  sm: "h-8 gap-1.5 px-3 text-[13px]",
  md: "h-10 gap-2 px-4 text-[14px]",
  lg: "h-12 gap-2 px-6 text-[15px]",
} as const;

export type ButtonVariant = keyof typeof variants;
export type ButtonSize = keyof typeof sizes;

export const buttonClass = (variant: ButtonVariant = "primary", size: ButtonSize = "md", className?: string) =>
  cn(
    "relative inline-flex select-none items-center justify-center whitespace-nowrap rounded-full font-medium tracking-[-0.01em]",
    "transition-[background-color,box-shadow,color,transform] duration-fast ease-out active:scale-[0.98] active:duration-75",
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
    <Link href={href} className={buttonClass(variant, size, className)} {...rest}>
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
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize; loading?: boolean }) {
  return (
    <button className={buttonClass(variant, size, className)} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      {loading && (
        <span className="absolute inset-0 grid place-items-center">
          <Loader2 className="size-4 animate-spin" aria-hidden />
        </span>
      )}
      <span className={cn("inline-flex items-center gap-[inherit]", loading && "invisible")}>{children}</span>
    </button>
  );
}
