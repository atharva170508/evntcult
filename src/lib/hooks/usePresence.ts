"use client";

import { useEffect, useState } from "react";

/**
 * Keeps an overlay mounted while it plays its exit, which is shorter than its entrance (§7: 20–30% faster).
 * Returns whether to render it and which phase it is in ("in" or "out").
 */
export function usePresence(open: boolean, exitMs: number) {
  const [mounted, setMounted] = useState(open);
  const [phase, setPhase] = useState<"in" | "out">("in");
  useEffect(() => {
    if (open) {
      setMounted(true);
      setPhase("in");
      return;
    }
    if (!mounted) return;
    setPhase("out");
    const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = setTimeout(() => setMounted(false), reduce ? 1 : exitMs);
    return () => clearTimeout(t);
  }, [open, mounted, exitMs]);
  return { mounted, phase };
}
