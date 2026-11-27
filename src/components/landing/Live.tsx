"use client";

import { animate, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

const nf = new Intl.NumberFormat("en-IN");

/** Counts up from zero the first time it scrolls into view. Final value on reduced motion. */
export function CountUp({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -15% 0px" });
  const reduce = useReducedMotion();
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (reduce) return setN(value);
    const c = animate(0, value, {
      duration: 1.4,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setN(Math.round(v)),
    });
    return () => c.stop();
  }, [inView, value, reduce]);

  return (
    <span ref={ref} className={className}>
      {nf.format(n)}
    </span>
  );
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Live time until `to` (ISO). Shows days/hours/minutes/seconds; "Happening now" once started. */
export function Countdown({
  to,
  end,
  className,
}: {
  to: string;
  end: string;
  className?: string;
}) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  if (now === null)
    return (
      <span className={className} aria-hidden>
        &nbsp;
      </span>
    );
  const start = Date.parse(to);
  if (now >= start && now < Date.parse(end)) {
    return (
      <span className={className}>
        <span
          className="mr-2 inline-block size-2 rounded-full bg-accent align-middle"
          aria-hidden
        />
        Happening now
      </span>
    );
  }
  let s = Math.max(0, Math.floor((start - now) / 1000));
  const d = Math.floor(s / 86400);
  s -= d * 86400;
  const h = Math.floor(s / 3600);
  s -= h * 3600;
  const m = Math.floor(s / 60);
  s -= m * 60;
  const parts: [number, string][] =
    d > 0
      ? [
          [d, "d"],
          [h, "h"],
          [m, "m"],
          [s, "s"],
        ]
      : [
          [h, "h"],
          [m, "m"],
          [s, "s"],
        ];
  return (
    <span
      className={className}
      role="timer"
      aria-label={`Starts in ${d ? `${d} days ` : ""}${h} hours ${m} minutes`}
    >
      {parts.map(([v, u]) => (
        <span key={u} className="mr-3 inline-flex items-baseline last:mr-0">
          <span className="tabular-nums">{u === "d" ? v : pad(v)}</span>
          <span className="ml-0.5 text-[0.55em] font-semibold text-ink-muted">
            {u}
          </span>
        </span>
      ))}
    </span>
  );
}
