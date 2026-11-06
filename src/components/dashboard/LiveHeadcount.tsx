"use client";

import { useEffect, useState } from "react";
import { Chip } from "@/components/ui/Chip";

/**
 * Live check-in ring (Zoho Backstage "checked in vs not yet" idea). Subscribes to
 * the SSE headcount stream and animates as volunteers scan passes at the gate.
 */
export function LiveHeadcount({
  eventId,
  title,
  capacity,
  registered,
  initial,
}: {
  eventId: string;
  title: string;
  capacity: number;
  registered: number;
  initial: number;
}) {
  const [count, setCount] = useState(initial);
  const [connected, setConnected] = useState(false);
  const [bump, setBump] = useState(false);

  useEffect(() => {
    const es = new EventSource(`/api/events/${eventId}/headcount?start=${initial}`);
    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);
    es.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (typeof data.checkedIn === "number") {
        setCount((prev) => {
          if (data.checkedIn !== prev) {
            setBump(true);
            setTimeout(() => setBump(false), 400);
          }
          return Math.min(data.checkedIn, registered);
        });
      }
    };
    return () => es.close();
  }, [eventId, initial, registered]);

  const pct = Math.min(1, count / Math.max(1, registered));
  const R = 62;
  const C = 2 * Math.PI * R;
  const yet = Math.max(0, registered - count);

  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
      <div className="relative mx-auto size-[156px] shrink-0 sm:mx-0">
        <svg viewBox="0 0 148 148" className="size-full -rotate-90">
          <circle cx="74" cy="74" r={R} fill="none" stroke="#f0f0f4" strokeWidth="12" />
          <circle
            cx="74"
            cy="74"
            r={R}
            fill="none"
            stroke="url(#hc-grad)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - pct)}
            style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.22,1,0.36,1)" }}
          />
          <defs>
            <linearGradient id="hc-grad" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0" stopColor="#0fa968" />
              <stop offset="1" stopColor="#5b3fff" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <div
              className="text-[38px] font-extrabold leading-none tracking-tighter tabular-nums transition-transform duration-300 ease-apple"
              style={{ transform: bump ? "scale(1.08)" : "scale(1)" }}
            >
              {count}
            </div>
            <div className="mt-1 text-[11.5px] font-semibold text-ink-subtle">checked in</div>
          </div>
        </div>
      </div>

      <div className="min-w-0 flex-1 space-y-3">
        <Chip tone={connected ? "live" : "neutral"} pulse={connected}>
          {connected ? "Live" : "Connecting…"}
        </Chip>
        <p className="headline truncate text-[19px]">{title}</p>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            ["Registered", registered],
            ["Capacity", capacity],
            ["Yet to arrive", yet],
          ].map(([l, v]) => (
            <div key={l} className="rounded-2xl bg-canvas px-2 py-2.5">
              <p className="text-[18px] font-bold tabular-nums">{v}</p>
              <p className="text-[11px] font-semibold text-ink-subtle">{l}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
