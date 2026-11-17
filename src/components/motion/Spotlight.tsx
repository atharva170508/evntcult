"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * A surface lit by the cursor: a soft radial light and a brighter edge follow the pointer.
 * Pure CSS custom properties — no re-renders, GPU-only. `tone` picks light for dark or paper surfaces.
 */
export function Spotlight({
  children,
  className,
  tone = "dark",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: "dark" | "light";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const move = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el || e.pointerType !== "mouse") return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  };
  return (
    <div ref={ref} onPointerMove={move} className={cn("spotlight group/spot relative isolate", tone === "dark" ? "spotlight-dark" : "spotlight-light", className)}>
      {children}
    </div>
  );
}
