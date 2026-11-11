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
        <span className="text-body-sm font-semibold text-ink-2">Mobile number</span>
        <div className="mt-2 flex items-center rounded-md border border-line bg-surface focus-within:border-brand">
          <span className="pl-4 pr-2 text-body font-semibold text-ink-muted">+91</span>
          <input
            type="tel"
            required
            inputMode="numeric"
            autoComplete="tel-national"
            maxLength={14}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="98765 43210"
            className="w-full rounded-r-md bg-transparent py-4 pr-4 text-body placeholder:text-ink-subtle focus:outline-none"
          />
        </div>
      </label>
      <label className="flex items-start gap-3 text-body-sm text-ink-2">
        <input type="checkbox" checked={optIn} onChange={(e) => setOptIn(e.target.checked)} className="mt-0.5 size-4 accent-brand" />
        <span>Send me event reminders and pass updates on WhatsApp.</span>
      </label>
    </>
  );
}
