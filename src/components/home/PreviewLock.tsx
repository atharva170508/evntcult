"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Landing-page preview cards are for looking only. Clicking one doesn't open an event:
 * it shows a small "Sign up to view & unlock live events" bubble instead.
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
        className="h-full cursor-pointer rounded-[inherit] outline-none focus-visible:ring-2 focus-visible:ring-volt"
      >
        {children}
      </div>
      {open && (
        <div
          id={tipId}
          role="status"
          className="absolute left-1/2 top-full z-20 mt-2 w-max max-w-[260px] -translate-x-1/2 rounded-2xl border border-volt/30 bg-surface px-4 py-3 text-left shadow-pop animate-fade-up"
        >
          <p className="flex items-center gap-2 text-[13.5px] font-bold text-ink">
            <Lock className="size-4 text-volt" aria-hidden /> Sign up to view & unlock live events
          </p>
          <Link href="/signin?mode=signup" className="mt-2 inline-flex rounded-full bg-volt px-3.5 py-1.5 text-[12.5px] font-bold text-ink-inverse hover:bg-volt-hover">
            Sign up free
          </Link>
        </div>
      )}
    </div>
  );
}
