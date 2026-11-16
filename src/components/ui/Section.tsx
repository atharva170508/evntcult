import { cn } from "@/lib/utils";

/** Heading block used at the top of every section: mono eyebrow, display title, optional sub and actions. */
export function SectionHeader({
  eyebrow,
  title,
  sub,
  actions,
  size = "md",
  as: Tag = "h2",
  id,
  className,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  sub?: React.ReactNode;
  actions?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  as?: "h1" | "h2" | "h3";
  id?: string;
  className?: string;
}) {
  const sizes = { sm: "text-h3", md: "text-display-md", lg: "text-display-lg", xl: "text-display-xl" } as const;
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-x-8 gap-y-4", className)}>
      <div className="min-w-0 max-w-3xl">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <Tag id={id} className={cn("font-semibold text-ink", sizes[size], eyebrow && "mt-3")}>
          {title}
        </Tag>
        {sub && <div className="mt-3 max-w-prose text-lead text-ink-muted">{sub}</div>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Marketing section wrapper with the shared vertical rhythm. */
export function Section({ className, children, ...rest }: React.HTMLAttributes<HTMLElement>) {
  return (
    <section className={cn("py-section", className)} {...rest}>
      {children}
    </section>
  );
}

/** Centred page container. */
export function Container({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-shell px-gutter", className)}>{children}</div>;
}
