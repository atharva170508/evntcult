"use client";

import { MotionConfig } from "motion/react";

/**
 * One motion language for the whole app: short, slightly springy, never bouncy.
 * reducedMotion="user" turns transforms off for people who ask their device for less motion
 * (opacity fades still run, so nothing pops in abruptly).
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ type: "spring", bounce: 0.12, duration: 0.55 }}>
      {children}
    </MotionConfig>
  );
}
