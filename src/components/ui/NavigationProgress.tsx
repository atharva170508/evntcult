"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Linear / Vercel–style 2.5px top-of-viewport route progress bar.
 * Starts immediately when any internal link is clicked and completes smoothly when the route updates.
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const search = useSearchParams();
  const [pct, setPct] = useState(0);
  const [visible, setVisible] = useState(false);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const doneRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Complete cleanly whenever route or query params settle
  useEffect(() => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    if (!visible) return;
    setPct(100);
    doneRef.current = setTimeout(() => {
      setVisible(false);
      setPct(0);
    }, 220);
    return () => {
      if (doneRef.current) clearTimeout(doneRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, search]);

  // Listen for internal link clicks
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      const anchor = (e.target as HTMLElement | null)?.closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      try {
        const dest = new URL(href, window.location.href);
        if (dest.origin !== window.location.origin) return;
        if (dest.pathname === window.location.pathname && dest.search === window.location.search) return;
      } catch {
        return;
      }

      if (doneRef.current) clearTimeout(doneRef.current);
      if (tickRef.current) clearInterval(tickRef.current);

      setVisible(true);
      setPct(18);
      tickRef.current = setInterval(() => {
        setPct((p) => (p >= 88 ? p : p + Math.max(1.5, (90 - p) * 0.14)));
      }, 160);
    };

    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      if (tickRef.current) clearInterval(tickRef.current);
      if (doneRef.current) clearTimeout(doneRef.current);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[2.5px] overflow-hidden print:hidden"
    >
      <div
        className="h-full bg-[linear-gradient(90deg,#1A1A1A_0%,#E3264F_65%,#F0D7FF_100%)] transition-[width,opacity] duration-200 ease-out"
        style={{ width: `${pct}%`, opacity: pct >= 100 ? 0 : 1 }}
      />
    </div>
  );
}
