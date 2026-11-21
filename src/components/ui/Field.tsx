import { useId } from "react";
import { cn } from "@/lib/utils";

/**
 * Form field anatomy: label (13px medium) → control (.field) → hint or error (12.5px).
 * Errors set aria-invalid and are linked with aria-describedby.
 */
export function Field({
  label,
  hint,
  error,
  optional,
  className,
  children,
}: {
  label: string;
  hint?: React.ReactNode;
  error?: string | null;
  optional?: boolean;
  className?: string;
  children: (props: {
    id: string;
    "aria-describedby"?: string;
    "aria-invalid"?: boolean;
  }) => React.ReactNode;
}) {
  const id = useId();
  const descId = hint || error ? `${id}-desc` : undefined;
  return (
    <div className={cn("block", className)}>
      <label
        htmlFor={id}
        className="flex items-baseline justify-between gap-2 text-[13px] font-medium text-ink"
      >
        {label}
        {optional && (
          <span className="text-[12px] font-normal text-ink-subtle">
            Optional
          </span>
        )}
      </label>
      <div className="mt-1.5">
        {children({
          id,
          "aria-describedby": descId,
          "aria-invalid": error ? true : undefined,
        })}
      </div>
      {(error || hint) && (
        <p
          id={descId}
          className={cn(
            "mt-1.5 text-[12.5px]",
            error ? "font-medium text-danger" : "text-ink-subtle",
          )}
        >
          {error || hint}
        </p>
      )}
    </div>
  );
}

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("field", className)} {...props} />;
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn("field min-h-[120px] resize-y leading-relaxed", className)}
      {...props}
    />
  );
}

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "field cursor-pointer appearance-none bg-[length:16px] bg-[right_12px_center] bg-no-repeat pr-10",
        "bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2362605A' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")]",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

/** Inline status message for forms and panels. */
export function Notice({
  tone = "neutral",
  icon: Icon,
  className,
  children,
}: {
  tone?: "neutral" | "danger" | "warn" | "live" | "accent";
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
  children: React.ReactNode;
}) {
  const tones = {
    neutral: "bg-sunken text-ink-2",
    danger: "bg-danger-soft text-danger",
    warn: "bg-warn-soft text-warn",
    live: "bg-live-soft text-live",
    accent: "bg-accent-soft text-accent-ink",
  } as const;
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2.5 rounded-tile px-3.5 py-3 text-[13.5px] font-medium",
        tones[tone],
        className,
      )}
    >
      {Icon && <Icon className="mt-[1px] size-4 shrink-0" />}
      <div className="min-w-0">{children}</div>
    </div>
  );
}
