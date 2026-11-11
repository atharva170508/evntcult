"use client";

import { Printer } from "lucide-react";

/** Opens the browser's print dialog ("Save as PDF" works there too). */
export function PrintButton() {
  return (
    <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-full bg-volt px-6 py-3 text-body font-semibold text-ink-inverse hover:bg-volt-hover">
      <Printer className="size-4" aria-hidden /> Print or save as PDF
    </button>
  );
}
