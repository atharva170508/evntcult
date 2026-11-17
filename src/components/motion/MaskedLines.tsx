"use client";

import { m } from "motion/react";
import { EASE } from "./MotionProvider";

/**
 * Headline that rises line by line out of a mask. Pass one node per line. Used once per page.
 * OVERRIDE: entrance 250ms → 400ms [craft tier §5] — the single hero choreography.
 */
export function MaskedLines({ lines, className, delay = 0.1 }: { lines: React.ReactNode[]; className?: string; delay?: number }) {
  return (
    <span className={className}>
      {lines.map((line, i) => (
        <span key={i} className="block overflow-hidden pb-[0.08em]">
          <m.span
            className="block"
            initial={{ y: "105%", opacity: 0 }}
            animate={{ y: "0%", opacity: 1 }}
            transition={{ duration: 0.4, ease: EASE, delay: delay + i * 0.08 }}
          >
            {line}
          </m.span>
        </span>
      ))}
    </span>
  );
}

/** Fades and lifts in on load, after the headline. */
export function Entrance({ children, className, delay = 0.35 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <m.div className={className} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease: EASE, delay }}>
      {children}
    </m.div>
  );
}
