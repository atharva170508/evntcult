"use client";

import { useEffect } from "react";

/** Feeds the cursor position to any `.ui-sheen` element under it, for the button hover light. */
export function SheenTracker() {
  useEffect(() => {
    if (!window.matchMedia("(hover: hover)").matches) return;
    const move = (e: PointerEvent) => {
      const el = (e.target as Element | null)?.closest?.<HTMLElement>(
        ".ui-sheen",
      );
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - r.left}px`);
      el.style.setProperty("--my", `${e.clientY - r.top}px`);
    };
    document.addEventListener("pointermove", move, { passive: true });
    return () => document.removeEventListener("pointermove", move);
  }, []);
  return null;
}
