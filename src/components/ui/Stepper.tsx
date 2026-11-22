"use client";

import { useRef } from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * − value + with hold-to-repeat, arrow keys, and free typing. Empty means "no limit" when
 * `allowEmpty` is set (shown as the placeholder, e.g. "No limit").
 */
export function Stepper({
  value,
  onChange,
  min = 0,
  max = 100000,
  step = 1,
  label,
  name,
  allowEmpty,
  placeholder,
  className,
  size = "md",
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  label: string;
  name?: string;
  allowEmpty?: boolean;
  placeholder?: string;
  className?: string;
  size?: "sm" | "md";
}) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cur = useRef(value);
  cur.current = value;
  const clamp = (n: number) => Math.min(max, Math.max(min, n));
  const bump = (d: number) => onChange(clamp((cur.current ?? (d > 0 ? min - step : min + step)) + d));
  const hold = (d: number) => {
    bump(d);
    let delay = 380;
    const go = () => {
      bump(d);
      delay = Math.max(40, delay * 0.8);
      timer.current = setTimeout(go, delay);
    };
    timer.current = setTimeout(go, delay);
  };
  const stop = () => timer.current && clearTimeout(timer.current);
  const h = size === "sm" ? "h-9" : "h-11";
  const btn = cn("grid place-items-center text-ink-2 transition-colors hover:bg-sunken active:scale-95 disabled:pointer-events-none disabled:opacity-30", size === "sm" ? "w-8" : "w-10");

  return (
    <div className={cn("ui-field overflow-hidden p-0", h, className)} role="group" aria-label={label}>
      <button type="button" tabIndex={-1} aria-label={`Decrease ${label}`} disabled={value !== null && value <= min} onPointerDown={() => hold(-step)} onPointerUp={stop} onPointerLeave={stop} className={cn(btn, "h-full")}>
        <Minus className="size-3.5" aria-hidden />
      </button>
      <input
        name={name}
        inputMode="numeric"
        aria-label={label}
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(e) => {
          const t = e.target.value.replace(/[^\d]/g, "");
          if (!t) return allowEmpty ? onChange(null) : onChange(min);
          onChange(clamp(Number(t)));
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowUp") (e.preventDefault(), bump(e.shiftKey ? step * 10 : step));
          if (e.key === "ArrowDown") (e.preventDefault(), bump(e.shiftKey ? -step * 10 : -step));
        }}
        className="h-full w-full min-w-0 bg-transparent text-center text-[14.5px] font-semibold tabular-nums text-ink outline-none placeholder:font-normal placeholder:text-ink-subtle"
      />
      <button type="button" tabIndex={-1} aria-label={`Increase ${label}`} disabled={value !== null && value >= max} onPointerDown={() => hold(step)} onPointerUp={stop} onPointerLeave={stop} className={cn(btn, "h-full")}>
        <Plus className="size-3.5" aria-hidden />
      </button>
    </div>
  );
}
