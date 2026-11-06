import QRCode from "qrcode";
import { Download, Wallet } from "lucide-react";
import type { NextUp } from "@/lib/data/types";
import { Chip } from "@/components/ui/Chip";
import { EventArt } from "@/components/ui/EventArt";
import { formatINR } from "@/lib/money";
import { fmtDate, fmtTime } from "@/lib/utils";

const payTone = { PAID: "live", PENDING: "warn", FAILED: "danger", REFUNDED: "neutral", WAIVED: "neutral", NOT_REQUIRED: "neutral" } as const;
const payLabel = { PAID: "Paid", PENDING: "Payment pending", FAILED: "Payment failed", REFUNDED: "Refunded", WAIVED: "Fee waived", NOT_REQUIRED: "Free entry" } as const;

/** Digital pass shaped like a real ticket: poster strip, perforation, signed QR. */
export async function PassCard({ pass }: { pass: NextUp }) {
  const svg = await QRCode.toString(pass.passToken, {
    type: "svg",
    margin: 0,
    errorCorrectionLevel: "M",
    color: { dark: "#121218", light: "#ffffff" },
  });

  return (
    <div className="card flex h-full flex-col overflow-hidden animate-fade-up" style={{ animationDelay: "80ms" }}>
      <div className="relative isolate h-[92px] overflow-hidden">
        <EventArt accent={pass.accent} />
        <div className="relative flex h-full flex-col justify-between p-4 text-white">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/85">Your pass</span>
            <Chip tone={payTone[pass.paymentStatus]} className="ring-1 ring-white/40">
              {payLabel[pass.paymentStatus]}
            </Chip>
          </div>
          <p className="truncate text-[16px] font-bold tracking-tight">{pass.title}</p>
        </div>
      </div>

      <div className="flex flex-1 flex-col px-5 pt-5">
        <div className="mx-auto w-full max-w-[176px] rounded-2xl border border-line bg-white p-3">
          <div className="aspect-square w-full [&>svg]:size-full" dangerouslySetInnerHTML={{ __html: svg }} />
        </div>
        <p className="mt-3 text-center font-mono text-[13px] font-semibold tracking-[0.14em] text-ink-2">{pass.passSerial}</p>
      </div>

      <div className="ticket-cut" />

      <div className="px-5 pb-5">
        <div className="grid grid-cols-3 text-center text-[12px]">
          <div>
            <p className="font-semibold text-ink-subtle">Date</p>
            <p className="font-bold">{fmtDate(pass.startsAt, { day: "numeric", month: "short" })}</p>
          </div>
          <div>
            <p className="font-semibold text-ink-subtle">Time</p>
            <p className="font-bold">{fmtTime(pass.startsAt)}</p>
          </div>
          <div>
            <p className="font-semibold text-ink-subtle">Fee</p>
            <p className="font-bold">{pass.feePaise > 0 ? formatINR(pass.feePaise) : "Free"}</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button className="inline-flex items-center justify-center gap-1.5 rounded-full border border-line py-2.5 text-[13px] font-semibold transition-colors hover:border-ink">
            <Download className="size-3.5" /> Save
          </button>
          <button className="inline-flex items-center justify-center gap-1.5 rounded-full bg-ink py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-black">
            <Wallet className="size-3.5" /> Add to Wallet
          </button>
        </div>
      </div>
    </div>
  );
}
