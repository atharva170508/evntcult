"use client";

import { LazyMotion, MotionConfig, domMax } from "motion/react";

/** One curve for the whole product (DESIGN.md › Motion); honours reduced motion everywhere. */
export const EASE = [0.16, 1, 0.3, 1] as const;

export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domMax} strict>
      <MotionConfig reducedMotion="user" transition={{ duration: 0.45, ease: EASE }}>
        {children}
      </MotionConfig>
    </LazyMotion>
  );
}
