"use client";

import { m } from "motion/react";
import { EASE } from "@/components/motion/MotionProvider";

/** Re-mounts on every navigation inside this section: a short fade so pages arrive, not appear. */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <m.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, ease: EASE }}>
      {children}
    </m.div>
  );
}
