"use client";

import { LazyMotion, MotionConfig, domMax } from "motion/react";

/** One curve for the whole product (DESIGN.md › Motion, antislop motion table); honours reduced motion everywhere. */
/** Exit curve: ease-in, 25–35% faster than entrances (antislop MO14). */
export const EASE_IN = [0.4, 0, 1, 1] as const;
export const EASE = [0.16, 1, 0.3, 1] as const;

export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domMax} strict>
      <MotionConfig reducedMotion="user" transition={{ duration: 0.25, ease: EASE }}>
        {children}
      </MotionConfig>
    </LazyMotion>
  );
}
