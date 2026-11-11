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
        <span className="text-label text-ink-muted">Mobile number</span>
        <div className="mt-2 flex h-12 items-center rounded-sm border border-line-strong bg-surface focus-within:border-accent md:h-10">
          <span className="pl-3 pr-2 font-mono text-body-sm text-ink-muted">+91</span>
          <input
            type="tel"
            required
            inputMode="numeric"
            autoComplete="tel-national"
            maxLength={14}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="98765 43210"
            className="h-full w-full bg-transparent pr-3 font-mono text-body placeholder:text-ink-subtle focus-visible:!border-0 focus-visible:!shadow-none"
          />
        </div>
      </label>
      <label className="flex min-h-11 items-start gap-3 text-body-sm text-ink-muted">
        <input type="checkbox" checked={optIn} onChange={(e) => setOptIn(e.target.checked)} className="mt-0.5 size-4 accent-[var(--accent)]" />
        <span>Send me event reminders and pass updates on WhatsApp.</span>
      </label>
    </>
  );
}
