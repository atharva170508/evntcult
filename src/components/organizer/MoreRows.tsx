"use client";

import { useState } from "react";

/** Phones: the guest table shows 25 rows; this reveals 25 more each tap. Laptops see every row. */
export function MoreRows({ tableId, total }: { tableId: string; total: number }) {
  const [n, setN] = useState(25);
  if (total <= n) return null;
  return (
    <div className="border-t border-line p-3 md:hidden">
      <style>{`@media (max-width: 767px) { #${tableId} tbody tr:nth-child(n+${n + 1}) { display: none; } }`}</style>
      <button
        type="button"
        onClick={() => setN((x) => x + 25)}
        className="h-11 w-full rounded-xl bg-sunken text-[15px] font-semibold text-ink active:bg-mist"
      >
        Show {Math.min(25, total - n)} more
      </button>
    </div>
  );
}
