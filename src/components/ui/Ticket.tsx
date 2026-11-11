"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Odometer } from "@/components/organizer-ui/primitives";
import { TOKENS } from "@/styles/tokens";

export interface TicketProps {
  category: string | null;
  title: string;
  dateLabel: string | null;
  time: string | null;
  venue: string | null;
  tagline: string | null;
  /** What the QR opens. Null until the event exists. */
  qrValue: string | null;
  passCode: string | null;
  priceLabel: string;
  seatsLabel: string;
}

const has = (v: string | null | undefined): v is string => !!v && v.trim() !== "";

/** The one physical object on the page. Everything on it comes from props; empty renders nothing. */
export function Ticket(p: TicketProps) {
  const [qr, setQr] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    if (!p.qrValue) {
      setQr(null);
      return;
    }
    QRCode.toString(p.qrValue, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: TOKENS.accentInk, light: TOKENS.qrGround } }).then((s) => live && setQr(s));
    return () => {
      live = false;
    };
  }, [p.qrValue]);

  return (
    <div className="o-ticket" role="group" aria-label="Pass preview">
      <div className="o-ticket-left">
        {has(p.category) && <div className="o-ticket-cat">{p.category.toUpperCase()}</div>}
        {has(p.title) && <div className="o-ticket-title">{p.title}</div>}
        {(has(p.dateLabel) || has(p.time)) && (
          <div className="o-ticket-meta">
            {has(p.dateLabel) && <span>{p.dateLabel}</span>}
            {has(p.time) && <span>{p.time} IST</span>}
          </div>
        )}
        {has(p.venue) && <div className="o-ticket-venue">{p.venue}</div>}
        {has(p.tagline) && <div className="o-ticket-tag">{p.tagline}</div>}
      </div>
      <div className="o-ticket-right">
        <div className="o-qr" aria-label={qr ? "QR code" : "QR code appears after the first save"}>
          {qr ? <span style={{ display: "block", width: "100%", height: "100%" }} dangerouslySetInnerHTML={{ __html: qr }} /> : null}
        </div>
        {has(p.passCode) && <div className="o-ticket-code">{p.passCode}</div>}
        <div className="o-ticket-price">
          <Odometer value={p.priceLabel} />
        </div>
        <div className="o-ticket-left-seats">{p.seatsLabel}</div>
      </div>
      <svg className="o-ticket-perf" aria-hidden width="1" height="208">
        <line x1="0.5" y1="9" x2="0.5" y2="199" stroke="var(--hair-strong)" strokeDasharray="7 7" />
      </svg>
      <span className="o-notch" aria-hidden style={{ top: -10 }} />
      <span className="o-notch" aria-hidden style={{ bottom: -10 }} />
    </div>
  );
}
