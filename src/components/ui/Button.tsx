import Link from "next/link";
import { cn } from "@/lib/utils";

const variants = {
  /** Light pill on the dark canvas — the main action. */
  primary: "bg-ink text-ink-inverse hover:bg-ink-2 shadow-[0_10px_24px_-12px_rgba(0,0,0,0.6)]",
  /** Neon-lime call to action (event-booking style). */
  volt: "bg-volt text-ink-inverse font-bold hover:bg-volt-hover shadow-[0_14px_34px_-16px_rgba(212,255,58,0.55)]",
  /** Frosted glass pill for use over gradients. */
  glass: "glass text-white hover:bg-white/15",
  /** Brand violet — for "create" / highlight actions. */
  brand: "bg-brand text-ink-inverse hover:bg-brand-hover shadow-brand",
  /** White pill with a border. */
  secondary: "border border-line bg-surface text-ink hover:border-line-strong hover:bg-canvas",
  /** Soft violet. */
  soft: "bg-brand-soft text-brand-ink hover:bg-[#2c2560]",
  /** Text-only link style. */
  ghost: "text-brand-ink hover:text-brand-hover",
  /** White pill for use on posters / dark areas. */
  light: "bg-white text-ink-inverse hover:bg-white/90",
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
