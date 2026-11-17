import { BrandMark } from "@/components/site/Brand";

/**
 * A sample OnePass drawn as a boarding pass. The QR is real: scanning it opens sign-up.
 * Labelled as a sample so nobody mistakes it for a ticket.
 */
export function BoardingPass({ qr, className }: { qr: string; className?: string }) {
  const field = (k: string, v: string, mono = false) => (
    <div>
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-subtle">{k}</p>
      <p className={mono ? "mt-1 font-mono text-[15px] font-medium tracking-[0.02em] text-ink" : "mt-1 text-[15px] font-semibold text-ink"}>{v}</p>
    </div>
  );

  return (
    <div className={className}>
      <div className="relative overflow-hidden rounded-[22px] bg-white text-ink shadow-[0_40px_90px_-30px_rgba(0,0,0,0.6)]">
        {/* header */}
        <div className="flex items-center justify-between bg-[#F4F5F7] px-6 py-4">
          <span className="flex items-center gap-2 text-[14px] font-[760] tracking-[-0.03em]">
            <BrandMark className="size-[22px]" /> evntcult
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-subtle">Boarding pass</span>
        </div>
        <div className="h-[3px] bg-[linear-gradient(90deg,#C9A45C,#E9D3A0_45%,#C9A45C)]" aria-hidden />

        {/* route */}
        <div className="flex items-end justify-between gap-4 px-6 pt-6">
          <div>
            <p className="font-display text-[44px] font-semibold leading-none tracking-[-0.03em]">YOU</p>
            <p className="mt-1.5 text-[12.5px] text-ink-subtle">Your room, tonight</p>
          </div>
          <svg viewBox="0 0 80 16" className="mb-5 h-4 w-16 shrink-0 text-ink-subtle sm:w-24" aria-hidden>
            <path d="M2 8H70" stroke="currentColor" strokeWidth="1.2" strokeDasharray="2 3" />
            <path d="M68 3l7 5-7 5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="text-right">
            <p className="font-display text-[44px] font-semibold leading-none tracking-[-0.03em]">GATE</p>
            <p className="mt-1.5 text-[12.5px] text-ink-subtle">Any event on campus</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 px-6 pb-6 pt-7">
          {field("Holder", "You")}
          {field("Seat", "Saved", false)}
          {field("Boards", "On scan")}
        </div>

        {/* tear line */}
        <div className="relative h-5" aria-hidden>
          <div className="absolute inset-x-6 top-1/2 border-t-[1.5px] border-dashed border-line-strong" />
          <div className="absolute -left-2.5 top-0 size-5 rounded-full bg-night" />
          <div className="absolute -right-2.5 top-0 size-5 rounded-full bg-night" />
        </div>

        {/* stub */}
        <div className="flex items-center gap-5 px-6 pb-6 pt-4">
          <div className="size-[104px] shrink-0 rounded-xl bg-white p-1.5 shadow-[0_0_0_1px_#E5E7EB] [&_svg]:block [&_svg]:size-full" dangerouslySetInnerHTML={{ __html: qr }} />
          <div className="min-w-0">
            {field("Pass", "EC-YOUR-PASS", true)}
            <p className="mt-3 text-[12.5px] leading-snug text-ink-subtle">Sample pass. Scan it to make yours.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
