"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * §8 Input — 48 tall on phones, 40 on desktop. The label sits above (12px) and never disappears;
 * a placeholder is only an example. Checked when you leave the field, then on every change after
 * the first error. The error replaces the helper and says how to fix it.
 * Focus is a 1.4px accent border plus a 2px ring (globals.css).
 */
export const fieldClass =
  "w-full rounded-sm border border-line-strong bg-surface px-3 text-body text-ink placeholder:text-ink-subtle transition-colors duration-micro hover:border-[color-mix(in_srgb,var(--hair-strong)_60%,var(--text-dim))] aria-[invalid=true]:border-bad focus-visible:border-accent disabled:cursor-not-allowed disabled:text-ink-subtle";

type Validate = (value: string) => string | null;

interface FieldProps {
  label: string;
  helper?: React.ReactNode;
  /** An error from the server, shown as is. */
  error?: string | null;
  /** Checked on blur, then on change once it has failed. */
  validate?: Validate;
  className?: string;
}

function useValidation(validate: Validate | undefined, serverError: string | null | undefined) {
  const [error, setError] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const check = (value: string) => {
    const e = validate ? validate(value) : null;
    setError(e);
    if (e) setFailed(true);
  };
  return {
    error: serverError ?? error,
    onBlur: (value: string) => check(value),
    onChange: (value: string) => {
      if (failed) check(value);
    },
  };
}

function FieldShell({ id, label, helper, error, className, children }: { id: string; label: string; helper?: React.ReactNode; error: string | null; className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={id} className="text-label text-ink-muted">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-msg`} className="text-label text-bad" role="alert">
          {error}
        </p>
      ) : helper ? (
        <p id={`${id}-msg`} className="text-label text-ink-subtle">
          {helper}
        </p>
      ) : null}
    </div>
  );
}

export function Input({ label, helper, error: serverError, validate, className, onBlur, onChange, ...props }: FieldProps & Omit<React.InputHTMLAttributes<HTMLInputElement>, "className">) {
  const id = useId();
  const v = useValidation(validate, serverError);
  return (
    <FieldShell id={props.id ?? id} label={label} helper={helper} error={v.error} className={className}>
      <input
        id={props.id ?? id}
        className={cn(fieldClass, "h-12 md:h-10", props.type === "number" || props.inputMode === "numeric" ? "font-mono tabular-nums" : "")}
        aria-invalid={!!v.error}
        aria-describedby={v.error || helper ? `${props.id ?? id}-msg` : undefined}
        onBlur={(e) => {
          v.onBlur(e.currentTarget.value);
          onBlur?.(e);
        }}
        onChange={(e) => {
          v.onChange(e.currentTarget.value);
          onChange?.(e);
        }}
        {...props}
      />
    </FieldShell>
  );
}

export function Textarea({ label, helper, error: serverError, validate, className, onBlur, onChange, ...props }: FieldProps & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "className">) {
  const id = useId();
  const v = useValidation(validate, serverError);
  return (
    <FieldShell id={props.id ?? id} label={label} helper={helper} error={v.error} className={className}>
      <textarea
        id={props.id ?? id}
        className={cn(fieldClass, "min-h-36 py-3")}
        aria-invalid={!!v.error}
        aria-describedby={v.error || helper ? `${props.id ?? id}-msg` : undefined}
        onBlur={(e) => {
          v.onBlur(e.currentTarget.value);
          onBlur?.(e);
        }}
        onChange={(e) => {
          v.onChange(e.currentTarget.value);
          onChange?.(e);
        }}
        {...props}
      />
    </FieldShell>
  );
}
