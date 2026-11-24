"use client";

import { useRef, useState } from "react";
import { m } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * 6-digit OTP input styled like Apple / Stripe: 3 + 3 warm paper tiles with a center separator,
 * backed by a single native `one-time-code` input so iOS/Android autofill, paste, and keyboard
 * editing all work flawlessly.
 */
export function OtpInput({
  value,
  onChange,
  disabled = false,
  hasError = false,
  autoFocus = true,
}: {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  hasError?: boolean;
  autoFocus?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);

  const digits = value.replace(/\D/g, "").slice(0, 6);
  const activeIdx = Math.min(digits.length, 5);

  const renderSlot = (i: number) => {
    const ch = digits[i] ?? "";
    const isActive = focused && activeIdx === i;
    const isFilled = Boolean(ch);

    return (
      <div
        key={i}
        aria-hidden
        className={cn(
          "relative flex h-14 flex-1 items-center justify-center rounded-xl border bg-surface font-mono text-[24px] font-semibold tabular-nums text-ink transition-[border-color,box-shadow,background-color,transform] duration-fast sm:h-16 sm:text-[26px]",
          hasError
            ? "border-danger bg-danger-soft/40 text-danger"
            : isActive
              ? "border-ink shadow-[0_0_0_1px_#1A1A1A,0_0_0_5px_rgba(240,215,255,0.85)]"
              : isFilled
                ? "border-ink/40 bg-surface shadow-card"
                : "border-line-strong bg-sunken/50",
          disabled && "opacity-50",
        )}
      >
        {isFilled ? (
          <m.span
            key={`${i}-${ch}`}
            initial={{ opacity: 0, y: 4, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 28 }}
          >
            {ch}
          </m.span>
        ) : isActive ? (
          <span className="h-6 w-[2px] rounded-full bg-accent motion-safe:animate-[caret_1s_steps(1)_infinite]" />
        ) : null}
      </div>
    );
  };

  return (
    <div
      className={cn("relative select-none", hasError && "shake")}
      onClick={() => inputRef.current?.focus()}
    >
      {/* Native input covers the full slot row for effortless tap, paste, and OS OTP autofill */}
      <input
        ref={inputRef}
        type="text"
        required
        autoFocus={autoFocus}
        disabled={disabled}
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="\d{6}"
        maxLength={6}
        aria-label="6-digit verification code"
        value={digits}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
        onPaste={(e) => {
          const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
          if (pasted) {
            e.preventDefault();
            onChange(pasted);
          }
        }}
        className="absolute inset-0 z-10 h-full w-full cursor-text opacity-0"
      />

      <div className="flex items-center gap-2 sm:gap-2.5">
        <div className="flex flex-1 gap-2 sm:gap-2.5">
          {renderSlot(0)}
          {renderSlot(1)}
          {renderSlot(2)}
        </div>
        <span aria-hidden className="h-0.5 w-2.5 shrink-0 rounded-full bg-line-strong" />
        <div className="flex flex-1 gap-2 sm:gap-2.5">
          {renderSlot(3)}
          {renderSlot(4)}
          {renderSlot(5)}
        </div>
      </div>
    </div>
  );
}
