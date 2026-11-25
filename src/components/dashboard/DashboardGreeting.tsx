"use client";

import { useEffect, useState } from "react";

function istParts(d: Date) {
  const fmt = (o: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", ...o }).format(d);
  const hour = Number(fmt({ hour: "numeric", hour12: false }));
  const greeting =
    hour < 5
      ? "Late night"
      : hour < 12
        ? "Good morning"
        : hour < 17
          ? "Good afternoon"
          : hour < 22
            ? "Good evening"
            : "Late night";
  return {
    greeting,
    weekday: fmt({ weekday: "long" }),
    monthShort: fmt({ month: "short" }).toUpperCase(),
    dayNum: fmt({ day: "numeric" }),
    clock: fmt({ hour: "numeric", minute: "2-digit" }).toLowerCase(),
  };
}

/**
 * Editorial greeting masthead for signed-in Home:
 * Physical mini tear-off calendar date tile + warm time-aware greeting + live IST clock.
 */
export function DashboardGreeting({
  name,
  subtitle,
  dateLine,
  asHeading = true,
}: {
  name: string;
  subtitle: string;
  dateLine: string;
  asHeading?: boolean;
}) {
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
        <div
          aria-hidden
          className="flex size-[54px] shrink-0 flex-col overflow-hidden rounded-[15px] border border-line-strong bg-surface shadow-[0_8px_20px_-12px_rgba(26,26,26,0.35)]"
        >
          <span className="flex h-[18px] items-center justify-center bg-[#E3264F] font-mono text-[9.5px] font-bold tracking-[0.1em] text-white">
            {parts ? parts.monthShort : "NOW"}
          </span>
          <span className="flex flex-1 items-center justify-center font-display text-[24px] leading-none tabular-nums text-ink">
            {parts ? parts.dayNum : "•"}
          </span>
        </div>

        <div className="min-w-0">
          <Heading
            id={asHeading ? "home-greeting" : undefined}
            className="font-display text-[clamp(30px,3.8vw,46px)] leading-[0.98] tracking-[-0.03em] text-ink"
          >
            {parts ? parts.greeting : "Welcome back"},{" "}
            <em className="italic">{firstName}.</em>
          </Heading>
          <p className="mt-1 text-[13.5px] font-medium text-ink-muted">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Quiet live IST time & date pill */}
      <div className="inline-flex w-fit items-center gap-2.5 rounded-full border border-line-strong bg-surface px-3.5 py-1.5 text-[12.5px] font-medium text-ink-2">
        <span className="size-1.5 rounded-full bg-live" aria-hidden />
        <span>{dateLine}</span>
        {parts && (
          <>
            <span className="h-3 w-px bg-line-strong" aria-hidden />
            <span className="font-mono text-[12px] font-semibold tabular-nums text-ink">
              {parts.clock}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
