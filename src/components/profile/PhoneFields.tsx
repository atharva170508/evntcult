"use client";

/** Mobile number + WhatsApp consent, shared by sign-up and the "add your number" card. */
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
  return (
    <>
      <label className="block">
        <span className="text-[13px] font-semibold text-ink-2">Mobile number</span>
        <div className="mt-1.5 flex items-center rounded-2xl border border-line bg-surface focus-within:border-brand">
          <span className="pl-4 pr-2 text-[15px] font-semibold text-ink-muted">+91</span>
          <input
            type="tel"
            required
            inputMode="numeric"
            autoComplete="tel-national"
            maxLength={14}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="98765 43210"
            className="w-full rounded-r-2xl bg-transparent py-3.5 pr-4 text-[15px] placeholder:text-ink-subtle focus:outline-none"
          />
        </div>
      </label>
      <label className="flex items-start gap-2.5 text-[13px] text-ink-2">
        <input type="checkbox" checked={optIn} onChange={(e) => setOptIn(e.target.checked)} className="mt-0.5 size-4 accent-brand" />
        <span>Send me event reminders and pass updates on WhatsApp. You can turn this off any time.</span>
      </label>
    </>
  );
}
