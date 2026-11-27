"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

function istClock(d: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "numeric",
    minute: "2-digit",
  })
    .format(d)
    .toLowerCase();
}

/** Editorial signed-in masthead: mono date & pass count above a large Gloock greeting. */
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
  const [clock, setClock] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => setClock(istClock(new Date()));
    sync();
    const id = setInterval(sync, 30_000);
    return () => clearInterval(id);
  }, []);

  const firstName = name.trim().split(/\s+/)[0] || name;
  const Heading = asHeading ? "h1" : "p";

  return (
    <div className="mb-8 border-b border-line pb-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="tr-meta text-ink-muted">
          {dateLine}
          {clock ? ` · ${clock} IST` : ""}
        </p>
        {passCount > 0 && (
          <Link
            href="/passes"
            className="tr-meta tr-link text-[#C9A26B]"
          >
            {passCount} {passCount === 1 ? "active pass" : "active passes"}
          </Link>
        )}
      </div>

      <Heading
        id={asHeading ? "home-greeting" : undefined}
        className="mt-4 font-display text-[clamp(38px,5vw,64px)] leading-[0.98] tracking-[-0.02em] text-ink"
      >
        {headline}, <em className="italic text-[#C9A26B]">{firstName}{headline.startsWith("What") ? "?" : "."}</em>
      </Heading>
      <p className="mt-2 text-[15.5px] font-light text-ink-muted">
        {subtitle}
      </p>
    </div>
  );
}
