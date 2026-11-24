"use client";

import { useEffect, useState } from "react";

/** Live local IST time shown on city/hub discovery pages (Luma teardown #2). */
export function LocalClock() {
  const [time, setTime] = useState<string>("");

  useEffect(() => {
    const fmt = () =>
      new Intl.DateTimeFormat("en-IN", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: "Asia/Kolkata",
      }).format(new Date());
    setTime(fmt());
    const id = window.setInterval(() => setTime(fmt()), 15_000);
    return () => window.clearInterval(id);
  }, []);

  if (!time) return null;

  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-[12.5px] font-medium tabular-nums text-ink-muted">
      <span className="size-1.5 rounded-full bg-live motion-safe:animate-pulse" aria-hidden />
      {time} IST
    </span>
  );
}
