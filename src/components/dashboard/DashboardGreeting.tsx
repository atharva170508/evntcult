"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Ticket } from "lucide-react";

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
 * Signed-in Home masthead: tear-off calendar tile, editorial greeting, and live IST clock pill.
 */
export function DashboardGreeting({
  headline,
  name,
  subtitle,
  dateLine,
  passCount = 0,
  asHeading = true,
}: {
  headline: string;
  name: string;
  subtitle: string;
  dateLine: string;
  passCount?: number;
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
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex items-center gap-4">
        <div
          aria-hidden
          className="flex size-[56px] shrink-0 flex-col overflow-hidden rounded-[15px] border border-line-strong bg-surface shadow-card"
        >
          <span className="flex h-[19px] items-center justify-center bg-[#E3264F] font-mono text-[9.5px] font-bold tracking-[0.08em] text-white">
            {parts ? parts.monthShort : "NOW"}
          </span>
          <span className="flex flex-1 items-center justify-center font-display text-[26px] leading-none tabular-nums text-ink">
            {parts ? parts.dayNum : "•"}
          </span>
        </div>

        <div className="min-w-0">
          <Heading
            id={asHeading ? "home-greeting" : undefined}
            className="font-display text-[clamp(34px,4vw,52px)] leading-[0.95] tracking-[-0.02em] text-ink"
          >
            {headline}, <em className="italic">{firstName}{headline.startsWith("What") ? "?" : "."}</em>
          </Heading>
          <p className="mt-1.5 text-[14px] font-medium text-ink-muted">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {passCount > 0 && (
          <Link
            href="/passes"
            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-line-strong bg-surface px-3.5 py-1.5 text-[12.5px] font-semibold text-ink transition-colors hover:border-ink"
          >
            <Ticket className="size-3.5 text-accent-ink" aria-hidden />
            <span className="tabular-nums">
              {passCount} {passCount === 1 ? "pass" : "passes"}
            </span>
          </Link>
        )}
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
    </div>
  );
}
