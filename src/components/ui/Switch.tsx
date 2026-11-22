"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

/**
 * A real toggle: the knob slides and stretches on press, the track fills ink. Renders a hidden
 * native checkbox when `name` is given so it still posts with plain <form> submissions.
 */
export function Switch({
  checked,
  defaultChecked,
  onChange,
  label,
  hint,
  name,
  value = "1",
  disabled,
  className,
}: {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (v: boolean) => void;
  label: React.ReactNode;
  hint?: React.ReactNode;
  name?: string;
  value?: string;
  disabled?: boolean;
  className?: string;
}) {
  const id = useId();
  return (
    <label htmlFor={id} className={cn("group flex cursor-pointer items-start justify-between gap-4", disabled && "cursor-not-allowed opacity-50", className)}>
      <span className="min-w-0">
        <span className="block text-[14px] font-semibold text-ink">{label}</span>
        {hint && <span className="mt-0.5 block text-[12.5px] leading-snug text-ink-muted">{hint}</span>}
      </span>
      <input
        id={id}
        type="checkbox"
        role="switch"
        name={name}
        value={value}
        checked={checked}
        defaultChecked={defaultChecked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
        className="peer sr-only"
      />
      <span aria-hidden className="ui-switch mt-0.5 shrink-0">
        <span className="ui-switch-knob" />
      </span>
    </label>
  );
}

/** A square check with a drawn tick, for lists and agreements. Same native-input contract. */
export function Checkbox({
  checked,
  defaultChecked,
  onChange,
  label,
  name,
  value = "1",
  required,
  disabled,
  className,
  "aria-label": ariaLabel,
}: {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (v: boolean) => void;
  label?: React.ReactNode;
  name?: string;
  value?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
}) {
  const id = useId();
  return (
    <label htmlFor={id} className={cn("inline-flex cursor-pointer items-start gap-2.5 text-[14px] text-ink", disabled && "cursor-not-allowed opacity-50", className)}>
      <input
        id={id}
        type="checkbox"
        name={name}
        value={value}
        checked={checked}
        defaultChecked={defaultChecked}
        required={required}
        disabled={disabled}
        aria-label={ariaLabel}
        onChange={(e) => onChange?.(e.target.checked)}
        className="peer sr-only"
      />
      <span aria-hidden className="ui-checkbox mt-[1px] shrink-0">
        <svg viewBox="0 0 12 12" className="size-3">
          <path d="M2.5 6.2 5 8.6l4.6-5.2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      {label && <span className="leading-snug">{label}</span>}
    </label>
  );
}

/** The visual alone, for a native checkbox you keep (give it className="peer sr-only" and put this right after it). */
export function CheckMark({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn("ui-checkbox mt-[1px] shrink-0", className)}>
      <svg viewBox="0 0 12 12" className="size-3">
        <path d="M2.5 6.2 5 8.6l4.6-5.2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}
export function SwitchMark({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn("ui-switch shrink-0", className)}>
      <span className="ui-switch-knob" />
    </span>
  );
}
