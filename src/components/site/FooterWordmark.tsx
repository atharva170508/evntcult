"use client";

import { useEffect, useState } from "react";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export function FooterWordmark() {
  return (
    <div
      aria-hidden
      className="-mb-3 mt-12 select-none overflow-hidden text-center font-display text-[clamp(64px,16.8vw,224px)] leading-[0.82] tracking-[-0.03em] text-[#EEE8DD]/[0.11]"
    >
      EVNTCULT
    </div>
  );
}

export function FooterHours() {
  const [today, setToday] = useState<number | null>(null);
  useEffect(() => {
    setToday(new Date().getDay());
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-[11px] uppercase tracking-[0.06em] text-[#9A9284]">
      {DAYS.map((day, idx) => (
        <span
          key={day}
          className={today === idx ? "text-[#C9A26B]" : undefined}
        >
          {day}
        </span>
      ))}
      <span className="text-[#EEE8DD]/30">/</span>
      <span>Gate scanner online 24h</span>
    </div>
  );
}

export function FooterFootnote() {
  return (
    <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-[#9A9284]">
      Synchronous Labs
    </span>
  );
}
