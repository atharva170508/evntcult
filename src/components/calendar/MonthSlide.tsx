"use client";

import { useEffect, useState } from "react";

/**
 * Slides the month grid in from the side you moved towards: next month from the right, the one
 * before from the left. Remembers the last month shown in this tab only.
 */
export function MonthSlide({ month, children }: { month: string; children: React.ReactNode }) {
  const [dir, setDir] = useState<0 | 1 | -1>(0);
  useEffect(() => {
    let last: string | null = null;
    try {
      last = sessionStorage.getItem("ec_cal_month");
      sessionStorage.setItem("ec_cal_month", month);
    } catch {
      // private mode
    }
    setDir(!last || last === month ? 0 : last < month ? 1 : -1);
  }, [month]);
  return (
    <div key={`${month}-${dir}`} className={dir === 1 ? "month-in-right" : dir === -1 ? "month-in-left" : undefined}>
      {children}
    </div>
  );
}
