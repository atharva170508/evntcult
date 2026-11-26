"use client";

import { m, useReducedMotion } from "motion/react";
import { COUT } from "@/lib/motion-curves";

/**
 * Tactile App-Mode route entrance: gives every signed-in page navigation a fast,
 * GPU-only COUT glide without blocking clicks or delaying interactivity.
 */
export function RouteStage({
  routeKey,
  children,
}: {
  routeKey: string;
  children: React.ReactNode;
}) {
  const reduced = !!useReducedMotion();
  if (reduced) return <>{children}</>;

  return (
    <m.div
      key={routeKey}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.36, ease: COUT }}
    >
      {children}
    </m.div>
  );
}
