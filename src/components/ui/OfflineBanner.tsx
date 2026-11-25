"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { WifiOff, Ticket } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import { toast } from "./Toaster";

/**
 * Campus-ready offline resilience banner:
 * Automatically appears when signal drops (e.g. auditorium gates) with a 1-tap jump to offline QR passes,
 * and confirms cleanly when connection returns.
 */
export function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const goOffline = () => setOffline(true);
    const goOnline = () => {
      setOffline((prev) => {
        if (prev) toast("Back online.", { tone: "ok" });
        return false;
      });
    };
    if (typeof navigator !== "undefined" && !navigator.onLine) setOffline(true);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  return (
    <AnimatePresence>
      {offline && (
        <m.div
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.2 }}
          className="sticky top-0 z-50 border-b border-white/10 bg-[#161514] px-gutter py-2.5 text-[#FFFEF6] print:hidden"
        >
          <div className="mx-auto flex max-w-[1360px] flex-wrap items-center justify-between gap-3 text-[13px]">
            <span className="inline-flex items-center gap-2 font-medium">
              <WifiOff className="size-4 text-[#FF8A9E]" aria-hidden />
              <span>You&apos;re offline. Saved passes in My Passes still scan at the gate.</span>
            </span>
            <Link
              href="/passes"
              className="inline-flex h-7 items-center gap-1.5 rounded-full bg-[#F0D7FF] px-3 text-[12px] font-semibold text-[#1A1A1A] hover:bg-[#E6C4FB]"
            >
              <Ticket className="size-3.5" aria-hidden />
              Open passes
            </Link>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
