"use client";

import { useEffect, useState } from "react";
import { m, useReducedMotion } from "motion/react";
import { COUT, QOUT } from "@/lib/motion-curves";

function istParts(d: Date) {
  const fmt = (o: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", ...o }).format(d);
  return {
    monthShort: fmt({ month: "short" }).toUpperCase(),
    dayNum: fmt({ day: "numeric" }),
    clock: fmt({ hour: "numeric", minute: "2-digit" }).toLowerCase(),
  };
}

/**
 * Editorial header for signed-in Home:
 * Physical mini tear-off calendar date tile (spring pop) + clip-masked editorial headline
 * + live IST clock pill.
 */
export function DashboardGreeting({
  headline,
  name,
  subtitle,
  dateLine,
  asHeading = true,
}: {
  headline: string;
  name: string;
  subtitle: string;
  dateLine: string;
  asHeading?: boolean;
}) {
  const reduced = !!useReducedMotion();
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const firstName = name.trim().split(/\s+/)[0] || name;
  const parts = now ? istParts(now) : null;
  const Heading = asHeading ? "h1" : "p";

  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        {/* Physical mini tear-off calendar date tile */}
        <m.div
          aria-hidden
          initial={reduced ? false : { opacity: 0, scale: 0.86, rotate: -6 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.55, ease: QOUT }}
          className="flex size-[54px] shrink-0 flex-col overflow-hidden rounded-[15px] border border-line-strong bg-surface shadow-[0_8px_20px_-12px_rgba(26,26,26,0.35)]"
        >
          <span className="flex h-[18px] items-center justify-center bg-[#E3264F] font-mono text-[9.5px] font-bold tracking-[0.1em] text-white">
            {parts ? parts.monthShort : "NOW"}
          </span>
          <span className="flex flex-1 items-center justify-center font-display text-[24px] leading-none tabular-nums text-ink">
            {parts ? parts.dayNum : "•"}
          </span>
        </m.div>

        <div className="min-w-0">
          <Heading
            id={asHeading ? "home-greeting" : undefined}
            className="overflow-hidden pb-0.5 font-display text-[clamp(30px,3.8vw,46px)] leading-[0.98] tracking-[-0.03em] text-ink"
          >
            <m.span
              initial={reduced ? false : { y: "-105%", opacity: 0.4 }}
              animate={{ y: "0%", opacity: 1 }}
              transition={{ delay: 0.08, duration: 0.62, ease: COUT }}
              className="block"
            >
              {headline}, <em className="italic">{firstName}{headline.startsWith("What") ? "?" : "."}</em>
            </m.span>
          </Heading>
          <m.p
            initial={reduced ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22, duration: 0.45, ease: COUT }}
            className="mt-1 text-[13.5px] font-medium text-ink-muted"
          >
            {subtitle}
          </m.p>
        </div>
      </div>

      {/* Quiet live IST time & date pill */}
      <m.div
        initial={reduced ? false : { opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.26, duration: 0.45, ease: COUT }}
        className="inline-flex w-fit items-center gap-2.5 rounded-full border border-line-strong bg-surface px-3.5 py-1.5 text-[12.5px] font-medium text-ink-2"
      >
        <span className="relative flex size-2" aria-hidden>
          <span className="absolute inset-0 animate-ping rounded-full bg-live opacity-60" />
          <span className="relative size-2 rounded-full bg-live" />
        </span>
        <span>{dateLine}</span>
        {parts && (
          <>
            <span className="h-3 w-px bg-line-strong" aria-hidden />
            <span className="font-mono text-[12px] font-semibold tabular-nums text-ink">
              {parts.clock}
            </span>
          </>
        )}
      </m.div>
    </div>
  );
}
