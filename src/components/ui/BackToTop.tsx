"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { AnimatePresence, m } from "motion/react";

/**
 * Subtle editorial back-to-top button with a live circular reading-progress ring.
 * Appears only after scrolling 520px; stops animating under prefers-reduced-motion.
 */
export function BackToTop() {
  const [progress, setProgress] = useState(0);
  const [show, setShow] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      setShow(y > 900);
      setProgress(Math.min(1, Math.max(0, y / max)));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const r = 18;
  const c = 2 * Math.PI * r;
  const nearBottom = progress > 0.85;

  return (
    <AnimatePresence>
      {show && (
        <div
          className="fixed bottom-20 right-5 z-30 hidden items-center gap-2 md:bottom-6 md:right-6 md:flex print:hidden"
          onPointerEnter={() => setHovered(true)}
          onPointerLeave={() => setHovered(false)}
        >
          <AnimatePresence>
            {hovered && (
              <m.span
                initial={{ opacity: 0, x: 8, scale: 0.94 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 6, scale: 0.96 }}
                transition={{ duration: 0.16 }}
                className="pointer-events-none whitespace-nowrap rounded-full bg-ink px-3 py-1.5 text-[12px] font-semibold text-white shadow-raised"
              >
                {nearBottom ? "Beam me up" : "Back to top"}
              </m.span>
            )}
          </AnimatePresence>
          <m.button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="Back to top"
            initial={{ opacity: 0, y: 12, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="ui-press group relative flex size-11 items-center justify-center rounded-full bg-surface text-ink shadow-raised ring-1 ring-line-strong hover:bg-sunken"
          >
            <svg className="pointer-events-none absolute inset-0 size-full -rotate-90" viewBox="0 0 44 44" aria-hidden>
              <circle cx="22" cy="22" r={r} fill="none" stroke="rgb(var(--c-line))" strokeWidth="2" />
              <circle
                cx="22"
                cy="22"
                r={r}
                fill="none"
                stroke="rgb(var(--c-ink))"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray={c}
                strokeDashoffset={c * (1 - progress)}
              />
            </svg>
            <ArrowUp
              className="relative size-4 transition-transform duration-200 group-hover:-translate-y-0.5"
              strokeWidth={2.2}
              aria-hidden
            />
          </m.button>
        </div>
      )}
    </AnimatePresence>
  );
}
