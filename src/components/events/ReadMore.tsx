"use client";

import { useEffect, useRef, useState } from "react";

/** Long descriptions fold to about ten lines with a fade and a Read more; short ones show in full. */
export function ReadMore({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [long, setLong] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (ref.current) setLong(ref.current.scrollHeight > 300);
  }, []);
  return (
    <div>
      <div
        ref={ref}
        className="relative overflow-hidden transition-[max-height] duration-500 ease-[var(--ease-enter)]"
        style={{ maxHeight: long && !open ? 272 : ref.current ? ref.current.scrollHeight + 40 : undefined }}
      >
        {children}
        {long && !open && <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-canvas to-transparent" />}
      </div>
      {long && (
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="mt-2 text-[15px] font-semibold text-ink underline decoration-line-strong decoration-2 underline-offset-[5px] hover:decoration-ink">
          {open ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}
