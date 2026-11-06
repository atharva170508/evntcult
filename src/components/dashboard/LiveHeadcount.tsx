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
    <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
      <div className="relative mx-auto size-[156px] shrink-0 sm:mx-0">
        <svg viewBox="0 0 148 148" className="size-full -rotate-90">
          <circle cx="74" cy="74" r={R} fill="none" stroke="#262a35" strokeWidth="12" />
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
              <stop offset="0" stopColor="#dcfe62" />
              <stop offset="1" stopColor="#a8d61c" />
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
        <Chip tone={mode === "live" ? "volt" : "neutral"} pulse={mode === "live"}>
          {mode === "live" ? "Live" : mode === "polling" ? "Updates every 5 s" : "Connecting…"}
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
