"use client";

import { useId } from "react";

/** Mobile number + WhatsApp consent, shared by sign-up, the dashboard card and /profile. */
export function PhoneFields({
  phone,
  setPhone,
  optIn,
  setOptIn,
}: {
  phone: string;
  setPhone: (v: string) => void;
  optIn: boolean;
  setOptIn: (v: boolean) => void;
}) {
  const id = useId();
  return (
    <>
      <div>
        <label htmlFor={`${id}-phone`} className="text-[13px] font-medium text-ink">
          Mobile number
        </label>
        <div className="field mt-1.5 flex items-center gap-2 p-0 focus-within:border-ink focus-within:ring-4 focus-within:ring-ink/[0.06]">
          <span className="border-r border-line py-3 pl-3.5 pr-3 font-mono text-[14px] text-ink-muted">+91</span>
          <input
            id={`${id}-phone`}
            type="tel"
            required
            inputMode="numeric"
            autoComplete="tel-national"
            maxLength={14}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="98765 43210"
            className="w-full rounded-r-xl bg-transparent py-3 pr-3.5 font-mono text-[15px] tracking-[0.02em] placeholder:text-ink-subtle focus:outline-none"
          />
        </div>
      </div>
      <label className="flex cursor-pointer items-start gap-3 rounded-tile bg-sunken/70 p-3.5 text-[13.5px] text-ink-2">
        <input type="checkbox" checked={optIn} onChange={(e) => setOptIn(e.target.checked)} className="mt-0.5 size-4 shrink-0 cursor-pointer accent-ink" />
        <span>Send me event reminders and pass updates on WhatsApp.</span>
      </label>
    </>
  );
}
