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
  capacity: number | null;
  registered: number;
  initial: number;
}) {
  const [count, setCount] = useState(initial);
  const [registered, setRegistered] = useState(initialRegistered);
  const [mode, setMode] = useState<"connecting" | "live" | "polling">("connecting");

  useEffect(() => {
    const apply = (d: { checkedIn?: number; registered?: number }) => {
      if (typeof d.registered === "number") setRegistered(d.registered);
      if (typeof d.checkedIn !== "number") return;
      setCount(d.checkedIn);
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
      <div className="relative mx-auto size-[156px] shrink-0 sm:mx-0">
        <svg viewBox="0 0 148 148" className="size-full -rotate-90">
          <circle cx="74" cy="74" r={R} fill="none" style={{ stroke: "var(--hair)" }} strokeWidth="12" />
          <circle
            cx="74"
            cy="74"
            r={R}
            fill="none"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - pct)}
            style={{ stroke: "var(--accent)", transition: "stroke-dashoffset var(--t-large) var(--ease)" }}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <div
              className="text-display font-semibold leading-none tabular-nums"
            >
              {count}
            </div>
            <div className="mt-1 text-caption font-semibold text-ink-subtle">checked in</div>
          </div>
        </div>
      </div>

      <div className="min-w-0 flex-1 space-y-3">
        <Chip tone={mode === "live" ? "volt" : "neutral"} pulse={mode === "live"}>
          {mode === "live" ? "Live" : mode === "polling" ? "Updates every 5 s" : "Connecting…"}
        </Chip>
        <p className="headline truncate text-title">{title}</p>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            ["Registered", registered],
            ["Capacity", capacity ?? "No limit"],
            ["Yet to arrive", yet],
          ].map(([l, v]) => (
            <div key={l} className="rounded-md bg-canvas px-2 py-3">
              <p className="text-title font-semibold tabular-nums">{v}</p>
              <p className="text-caption font-semibold text-ink-subtle">{l}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
