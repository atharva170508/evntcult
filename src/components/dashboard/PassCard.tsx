import QRCode from "qrcode";
import { CalendarPlus } from "lucide-react";
import { SavePassButton } from "@/components/passes/SavePassButton";
import type { NextUp } from "@/lib/data/types";
import { Chip } from "@/components/ui/Chip";
import { EventArt } from "@/components/ui/EventArt";
import { formatINR } from "@/lib/money";
import { fmtDate, fmtTime } from "@/lib/utils";
import { TOKENS } from "@/styles/tokens";

const payTone = { PAID: "live", PENDING: "warn", FAILED: "danger", REFUNDED: "neutral", WAIVED: "neutral", NOT_REQUIRED: "neutral" } as const;
const payLabel = { PAID: "Paid", PENDING: "Payment pending", FAILED: "Payment failed", REFUNDED: "Refunded", WAIVED: "Fee waived", NOT_REQUIRED: "Free entry" } as const;

/** Digital pass shaped like a real ticket: poster strip, perforation, signed QR. */
export async function PassCard({ pass }: { pass: NextUp }) {
  const svg = await QRCode.toString(pass.passToken, {
    type: "svg",
    margin: 0,
    errorCorrectionLevel: "M",
    color: { dark: TOKENS.accentInk, light: TOKENS.qrGround },
  });

  return (
    <div className="card flex h-full flex-col overflow-hidden" style={{ animationDelay: "80ms" }}>
      <div className="relative isolate h-[92px] overflow-hidden">
        <EventArt accent={pass.accent} />
        <div className="relative flex h-full flex-col justify-between p-4 text-white">
          <div className="flex items-center justify-between">
            <span className="text-caption font-semibold uppercase tracking-[0.12em] text-white/85">Your pass</span>
            <Chip tone={payTone[pass.paymentStatus]} className="ring-1 ring-white/40">
              {payLabel[pass.paymentStatus]}
            </Chip>
          </div>
          <p className="truncate text-body font-semibold">{pass.title}</p>
        </div>
      </div>

      <div className="flex flex-1 flex-col px-6 pt-6">
        <div className="mx-auto w-full max-w-[176px] rounded-md border border-line bg-white p-3">
          <div className="aspect-square w-full [&>svg]:size-full" dangerouslySetInnerHTML={{ __html: svg }} />
        </div>
        <p className="mt-3 text-center font-mono text-body-sm font-semibold tracking-[0.12em] text-ink-2">{pass.passSerial}</p>
      </div>

      <div className="ticket-cut" />

      <div className="px-6 pb-6">
        <div className="grid grid-cols-3 text-center text-label">
          <div>
            <p className="font-semibold text-ink-subtle">Date</p>
            <p className="font-semibold">{fmtDate(pass.startsAt, { day: "numeric", month: "short" })}</p>
          </div>
          <div>
            <p className="font-semibold text-ink-subtle">Time</p>
            <p className="font-semibold">{fmtTime(pass.startsAt)}</p>
          </div>
          <div>
            <p className="font-semibold text-ink-subtle">Fee</p>
            <p className="font-semibold">{pass.feePaise > 0 ? formatINR(pass.feePaise) : "Free"}</p>
          </div>
        </div>
        <div className="mt-4 grid gap-2">
          <SavePassButton
            title={pass.title}
            dateLabel={fmtDate(pass.startsAt, { weekday: "short", day: "numeric", month: "short" })}
            timeLabel={fmtTime(pass.startsAt)}
            venue={pass.venueName ?? ""}
            passCode={pass.passSerial}
            qrSvg={svg}
            className="w-full py-3"
          />
          <a
            href={`/api/registrations/${pass.registrationId}/ics`}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-volt py-3 text-body-sm font-semibold text-ink-inverse transition-colors hover:bg-volt-hover"
          >
            <CalendarPlus className="size-3.5" aria-hidden /> Add to calendar
          </a>
        </div>
      </div>
    </div>
  );
}
