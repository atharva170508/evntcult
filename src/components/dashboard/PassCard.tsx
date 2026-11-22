import { brandQr } from "@/lib/qr-art";
import { CalendarPlus } from "lucide-react";
import { SavePassButton } from "@/components/passes/SavePassButton";
import type { NextUp } from "@/lib/data/types";
import { Chip } from "@/components/ui/Chip";
import { LogoIcon } from "@/components/brand/MissingE";
import { buttonClass } from "@/components/ui/Button";
import { formatINR } from "@/lib/money";
import { fmtDate, fmtTime } from "@/lib/utils";
import { svgSrc } from "@/lib/svg-src";
import { passName } from "@/lib/pass-name";

const payTone = { PAID: "live", PENDING: "warn", FAILED: "danger", REFUNDED: "neutral", WAIVED: "neutral", NOT_REQUIRED: "neutral" } as const;
const payLabel = { PAID: "Paid", PENDING: "Payment pending", FAILED: "Payment failed", REFUNDED: "Refunded", WAIVED: "Fee waived", NOT_REQUIRED: "Free entry" } as const;

/** The pass as a ticket: ink header, QR, perforation, stub with date · time · fee. */
export async function PassCard({ pass }: { pass: NextUp }) {
  const svg = brandQr(pass.passToken, { kind: "pass" });

  return (
    <article aria-label={`Pass for ${pass.title}`} className="card flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-3 bg-night px-5 py-3.5 text-white">
        <span className="flex items-center gap-2 text-[12.5px] text-white/70">
          <LogoIcon className="size-5" blink={false} /> Your pass
        </span>
        <Chip tone={payTone[pass.paymentStatus]}>{payLabel[pass.paymentStatus]}</Chip>
      </div>

      <div className="flex flex-1 flex-col px-5 pt-5">
        <p className="truncate text-h4 font-semibold">{pass.title}</p>
        <div className="mx-auto mt-5 w-full max-w-[184px] rounded-xl bg-white p-3 ring-1 ring-line">
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={svgSrc(svg)} alt="Entry QR code" className="block aspect-square w-full" />
          </>
        </div>
        <p className="mt-3 text-center font-display text-[18px] text-ink">{passName(pass.passSerial).name}</p>
      </div>

      <div className="ticket-cut mt-4" />

      <div className="px-5 pb-5">
        <dl className="grid grid-cols-3 text-center">
          {[
            ["Date", fmtDate(pass.startsAt, { day: "numeric", month: "short" })],
            ["Time", fmtTime(pass.startsAt)],
            ["Fee", pass.feePaise > 0 ? formatINR(pass.feePaise) : "Free"],
          ].map(([l, v]) => (
            <div key={l}>
              <dt className="eyebrow">{l}</dt>
              <dd className="mt-1 text-[14px] font-medium tabular-nums">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-5 grid gap-2">
          <SavePassButton
            title={pass.title}
            dateLabel={fmtDate(pass.startsAt, { weekday: "short", day: "numeric", month: "short" })}
            timeLabel={fmtTime(pass.startsAt)}
            venue={pass.venueName ?? ""}
            passCode={pass.passSerial}
            qrSvg={svg}
            className="w-full"
          />
          <a href={`/api/registrations/${pass.registrationId}/ics`} className={buttonClass("ghost", "md", "w-full")}>
            <CalendarPlus className="size-4" aria-hidden /> Add to calendar
          </a>
        </div>
      </div>
    </article>
  );
}
