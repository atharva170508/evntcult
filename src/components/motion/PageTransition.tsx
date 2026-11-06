"use client";

import { useEffect } from "react";
import { motion } from "motion/react";

/**
 * Pages fade up a little when you navigate inside the app (used by app/(app)/template.tsx).
 * The very first page load is NOT hidden: server HTML shows immediately, even on a slow
 * phone before JavaScript arrives. Only later client-side navigations animate.
 */
let navigatedOnce = false;

export function PageTransition({ children }: { children: React.ReactNode }) {
  const animateIn = navigatedOnce;
  useEffect(() => {
    navigatedOnce = true;
  }, []);
  return (
    <motion.div initial={animateIn ? { opacity: 0, y: 8 } : false} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  );
}
