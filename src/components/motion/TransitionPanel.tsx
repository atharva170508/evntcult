"use client";

import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { EASE } from "./MotionProvider";

/**
 * Adapted from motion-primitives/transition-panel.
 * Smooth blur + vertical crossfade when switching tab or demo panels.
 */
export function TransitionPanel({
  activeIndex,
  children,
  className,
}: {
  activeIndex: number;
  children: React.ReactNode[];
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <div className={className}>
      <AnimatePresence initial={false} mode="wait">
        <m.div
          key={activeIndex}
          initial={reduce ? false : { opacity: 0, y: 8, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={reduce ? undefined : { opacity: 0, y: -6, filter: "blur(4px)" }}
          transition={{ duration: 0.24, ease: EASE }}
        >
          {children[activeIndex]}
        </m.div>
      </AnimatePresence>
    </div>
  );
}
