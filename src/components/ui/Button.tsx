import Link from "next/link";
import { cn } from "@/lib/utils";

const variants = {
  /** Dark pill — the main action (Meetup / District style). */
  primary: "bg-ink text-ink-contrast hover:bg-ink/85",
  /** Brand violet — for "create" / highlight actions. */
  brand: "bg-brand text-brand-on hover:bg-brand-hover shadow-brand",
  /** White pill with a border. */
  secondary: "border border-line bg-surface text-ink hover:border-line-strong hover:bg-canvas",
  /** Soft violet. */
  soft: "bg-brand-soft text-brand-ink hover:bg-brand/20",
  /** Text-only link style. */
  ghost: "text-brand hover:text-brand-hover",
  /** White pill for use on posters / dark areas. */
  light: "bg-paper text-night hover:bg-paper/90",
} as const;

type Variant = keyof typeof variants;

const base =
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2.5 text-[14px] font-semibold transition-all duration-200 ease-apple active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40";

export function LinkButton({
  href,
  variant = "primary",
  className,
  children,
}: {
  href: string;
  variant?: Variant;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={cn(base, variants[variant], className)}>
      {children}
    </Link>
  );
}

export function Button({
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button className={cn(base, variants[variant], className)} {...props} />;
}
