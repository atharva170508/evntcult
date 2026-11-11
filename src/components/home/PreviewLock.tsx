"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonClass } from "@/components/ui/Button";

/**
 * Landing-page preview cards are for looking only. Clicking one doesn't open an event:
 * it shows a small "Sign up to see this event" note instead.
 */
export function PreviewLock({ children, className, label }: { children: React.ReactNode; className?: string; label: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const tipId = useId();

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const timer = setTimeout(() => setOpen(false), 5000);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  return (
    <div ref={ref} className={cn("relative", className)}>
      <div
        role="button"
        tabIndex={0}
        aria-label={`${label}: preview only`}
        aria-describedby={open ? tipId : undefined}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen((o) => !o);
          }
        }}
        className="h-full cursor-pointer rounded-[inherit]"
      >
        {children}
      </div>
      {open && (
        <div
          id={tipId}
          role="status"
          className="ec-menu absolute left-1/2 top-full z-20 mt-2 w-max max-w-[260px] -translate-x-1/2 rounded-md border border-line-strong bg-surface-2 px-4 py-3 text-left shadow-overlay"
          data-phase="in"
        >
          <p className="text-body-sm text-ink">Sign up to see this event and register.</p>
          <Link href="/signin?mode=signup" className={buttonClass("primary", "sm", "mt-3")}>
            Sign up
          </Link>
        </div>
      )}
    </div>
  );
}
