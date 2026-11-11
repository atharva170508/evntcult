"use client";


/** Opens the browser's print dialog ("Save as PDF" works there too). */
export function PrintButton() {
  return (
    <button onClick={() => window.print()} className="press inline-flex items-center gap-2 rounded-md bg-accent px-6 h-10 text-body font-semibold text-ink-inverse hover:bg-[color-mix(in_srgb,var(--accent)_90%,var(--text))]">
       Print or save as PDF
    </button>
  );
}
