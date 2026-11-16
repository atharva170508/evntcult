"use client";

import { Printer } from "lucide-react";
import { buttonClass } from "@/components/ui/Button";

/** Opens the browser's print dialog ("Save as PDF" works there too). */
export function PrintButton() {
  return (
    <button onClick={() => window.print()} className={buttonClass("primary", "md")}>
      <Printer className="size-4" aria-hidden /> Print or save as PDF
    </button>
  );
}
