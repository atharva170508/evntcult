"use client";

import { useEffect, useState } from "react";
import { Chip } from "@/components/ui/Chip";

/**
 * Live check-in ring (Zoho Backstage "checked in vs not yet" idea). Connects to the
 * event's live gate count (WebSocket to its EventLive Durable Object, see worker.ts)
 * and animates as volunteers scan passes. Falls back to asking every 5 seconds when
 * a live connection isn't available (e.g. plain `next dev`).
 */
export function LiveHeadcount({
  eventId,
  title,
  capacity,
  registered: initialRegistered,
  initial,
}: {
  eventId: string;
  title: string;
  capacity: number;
  registered: number;
  initial: number;
}) {
  const [count, setCount] = useState(initial);
  const [registered, setRegistered] = useState(initialRegistered);
  const [mode, setMode] = useState<"connecting" | "live" | "polling">("connecting");
  const [bump, setBump] = useState(false);

  useEffect(() => {
    const apply = (d: { checkedIn?: number; registered?: number }) => {
      if (typeof d.registered === "number") setRegistered(d.registered);
      if (typeof d.checkedIn !== "number") return;
      const next = d.checkedIn;
      setCount((prev) => {
        if (next !== prev) {
          setBump(true);
          setTimeout(() => setBump(false), 400);
        }
        return next;
      });
    };

    let ws: WebSocket | null = null;
    let closed = false;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let ping: ReturnType<typeof setInterval> | undefined;
    const connect = () => {
      ws = new WebSocket(`${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/api/events/${eventId}/live`);
      ws.onopen = () => {
        setMode("live");
        ping = setInterval(() => ws?.readyState === WebSocket.OPEN && ws.send("ping"), 25_000);
      };
      ws.onmessage = (m) => {
        try {
          const d = JSON.parse(m.data as string);
          if (d.type === "counts") apply(d);
        } catch {
          // "pong"
        }
      };
      ws.onclose = () => {
        clearInterval(ping);
        setMode("polling");
        if (!closed) retry = setTimeout(connect, 15_000);
      };
    };
    connect();

    const poll = setInterval(async () => {
      if (ws?.readyState === WebSocket.OPEN) return;
      try {
        const res = await fetch(`/api/events/${eventId}/gate-count`, { cache: "no-store" });
        if (res.ok) apply(await res.json());
      } catch {
        // offline: keep the last number
      }
    }, 5000);

    return () => {
      closed = true;
      clearTimeout(retry);
      clearInterval(ping);
      clearInterval(poll);
      ws?.close();
    };
  }, [eventId]);

  const pct = Math.min(1, count / Math.max(1, registered));
  const R = 62;
  const C = 2 * Math.PI * R;
  const yet = Math.max(0, registered - count);

  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
      <div className="relative mx-auto size-[152px] shrink-0 sm:mx-0">
        <svg viewBox="0 0 148 148" className="size-full -rotate-90" aria-hidden>
          <circle cx="74" cy="74" r={R} fill="none" stroke="#EEECE6" strokeWidth="10" />
          <circle
            cx="74"
            cy="74"
            r={R}
            fill="none"
            stroke="#111110"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - pct)}
            style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.16,1,0.3,1)" }}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <div
              className="font-mono text-[36px] font-medium leading-none tracking-[-0.05em] tabular-nums transition-transform duration-base ease-spring"
              style={{ transform: bump ? "scale(1.08)" : "scale(1)" }}
              aria-live="polite"
            >
              {count}
            </div>
            <div className="mt-1.5 text-[12px] text-ink-muted">checked in</div>
          </div>
        </div>
      </div>

      <div className="min-w-0 flex-1 space-y-3">
        <Chip tone={mode === "live" ? "accent" : "neutral"} pulse={mode === "live"}>
          {mode === "live" ? "Live" : mode === "polling" ? "Updates every 5 s" : "Connecting…"}
        </Chip>
        <p className="truncate text-h4 font-semibold">{title}</p>
        <dl className="grid grid-cols-3 divide-x divide-line rounded-tile bg-sunken/70 py-2.5 text-center">
          {(
            [
              ["Registered", registered],
              ["Capacity", capacity],
              ["Yet to arrive", yet],
            ] as const
          ).map(([l, v]) => (
            <div key={l} className="flex flex-col-reverse px-2">
              <dt className="text-[11.5px] text-ink-muted">{l}</dt>
              <dd className="font-mono text-[18px] font-medium tabular-nums">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
