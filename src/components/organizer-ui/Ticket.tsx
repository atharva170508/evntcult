"use client";

import { useEffect, useMemo, useState } from "react";
import { brandQr } from "@/lib/qr-art";
import { Odometer } from "./primitives";
import { svgSrc } from "@/lib/svg-src";

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
  // Drawn on the client only (the value depends on the browser's host), so no hydration mismatch.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const qr = useMemo(() => (mounted && p.qrValue ? brandQr(p.qrValue, { kind: "link" }) : null), [mounted, p.qrValue]);

  return (
    <div className="o-ticket" role="group" aria-label="Pass preview">
      <div className="o-ticket-left">
        {has(p.category) && <div className="o-ticket-cat">{p.category}</div>}
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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {qr ? <img src={svgSrc(qr)} alt="Pass QR code" style={{ display: "block", width: "100%", height: "100%" }} /> : null}
        </div>
        {has(p.passCode) && <div className="o-ticket-code">{p.passCode}</div>}
        <div className="o-ticket-price">
          <Odometer value={p.priceLabel} />
        </div>
        <div className="o-ticket-left-seats">{p.seatsLabel}</div>
      </div>
      <svg className="o-ticket-perf" aria-hidden width="1" height="208">
        <line x1="0.5" y1="9" x2="0.5" y2="199" stroke="#D1CDC4" strokeDasharray="7 7" />
      </svg>
      <span className="o-notch" aria-hidden style={{ top: -10 }} />
      <span className="o-notch" aria-hidden style={{ bottom: -10 }} />
    </div>
  );
}
