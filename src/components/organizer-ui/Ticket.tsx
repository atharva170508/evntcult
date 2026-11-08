"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Odometer } from "./primitives";

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

const dash = (v: string | null | undefined) => (v && v.trim() ? v : "—");

/** The one physical object on the page. Everything on it comes from props; empty renders a dash. */
export function Ticket(p: TicketProps) {
  const [qr, setQr] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    if (!p.qrValue) {
      setQr(null);
      return;
    }
    QRCode.toString(p.qrValue, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#0a0a0c", light: "#eeeee8" } }).then((s) => live && setQr(s));
    return () => {
      live = false;
    };
  }, [p.qrValue]);

  return (
    <div className="o-ticket" role="group" aria-label="Pass preview">
      <div className="o-ticket-left">
        <div className="o-ticket-cat">{dash(p.category?.toUpperCase())}</div>
        <div className="o-ticket-title">{dash(p.title)}</div>
        <div className="o-ticket-rule" />
        <div className="o-ticket-meta">
          <span>{dash(p.dateLabel)}</span>
          <span>{p.time ? `${p.time} IST` : "—"}</span>
        </div>
        <div className="o-ticket-venue">{dash(p.venue)}</div>
        <div className="o-ticket-tag">{dash(p.tagline)}</div>
      </div>
      <div className="o-ticket-right">
        <div className="o-qr" aria-label={qr ? "QR code" : "QR code appears after the first save"}>
          {qr ? <span style={{ display: "block", width: "100%", height: "100%" }} dangerouslySetInnerHTML={{ __html: qr }} /> : "—"}
        </div>
        <div className="o-ticket-code">{dash(p.passCode)}</div>
        <div className="o-ticket-price">
          <Odometer value={p.priceLabel} />
        </div>
        <div className="o-ticket-left-seats">{p.seatsLabel}</div>
      </div>
      <svg className="o-ticket-perf" aria-hidden width="1" height="312">
        <line x1="0.5" y1="9" x2="0.5" y2="303" stroke="#3A3A44" strokeDasharray="7 7" />
      </svg>
      <span className="o-notch" aria-hidden style={{ top: -10 }} />
      <span className="o-notch" aria-hidden style={{ bottom: -10 }} />
    </div>
  );
}
