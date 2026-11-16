"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Landing-page preview cards are for looking only. Activating one shows a small
 * "Sign up to view & unlock live events" popover instead of opening the event.
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
        className="h-full cursor-pointer rounded-[inherit] outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
      >
        {children}
      </div>
      {open && (
        <div
          id={tipId}
          role="status"
          className="absolute left-1/2 top-full z-20 mt-2 w-max max-w-[280px] -translate-x-1/2 animate-scale-in rounded-card bg-surface p-4 text-left shadow-pop"
        >
          <p className="flex items-center gap-2 text-[14px] font-medium text-ink">
            <Lock className="size-4 text-ink-muted" aria-hidden /> Sign up to view & unlock live events
          </p>
          <Link
            href="/signin?mode=signup"
            className="mt-3 inline-flex h-8 items-center rounded-full bg-ink px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-[#2a2a28]"
          >
            Sign up free
          </Link>
        </div>
      )}
    </div>
  );
}
