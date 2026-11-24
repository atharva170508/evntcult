"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, m } from "motion/react";
import { cn } from "@/lib/utils";

const CHAPTERS = [
  { id: "onepass", label: "One Pass" },
  { id: "vault-usp-h", label: "Photo Vault" },
  { id: "studio-h", label: "Themes" },
  { id: "explore", label: "Hubs" },
  { id: "hosts", label: "For Hosts" },
];

/**
 * Editorial floating chapter navigator (desktop only). Appears once the visitor scrolls past
 * the hero, highlights the chapter currently in view, and jumps smoothly on click.
 */
export function ChapterNav() {
  const [visible, setVisible] = useState(false);
  const [active, setActive] = useState(CHAPTERS[0].id);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 420);
      const mid = window.innerHeight * 0.42;
      let best = CHAPTERS[0].id;
      for (const ch of CHAPTERS) {
        const el = document.getElementById(ch.id);
        if (!el) continue;
        const top = el.getBoundingClientRect().top;
        if (top <= mid) best = ch.id;
      }
      setActive(best);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const jump = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <AnimatePresence>
      {visible && (
        <m.nav
          aria-label="Page chapters"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 18 }}
          transition={{ duration: 0.24 }}
          className="fixed bottom-6 left-1/2 z-30 hidden -translate-x-1/2 items-center gap-0.5 rounded-full bg-surface/92 p-1.5 shadow-pop ring-1 ring-line-strong backdrop-blur-xl md:flex print:hidden"
        >
          {CHAPTERS.map((ch) => {
            const on = active === ch.id;
            return (
              <button
                key={ch.id}
                type="button"
                onClick={() => jump(ch.id)}
                aria-current={on ? "location" : undefined}
                className={cn(
                  "relative rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors",
                  on ? "text-white" : "text-ink-muted hover:text-ink",
                )}
              >
                {on && (
                  <m.span
                    layoutId="chapter-active-pill"
                    aria-hidden
                    className="absolute inset-0 -z-10 rounded-full bg-ink"
                    transition={{ type: "spring", stiffness: 460, damping: 36 }}
                  />
                )}
                {ch.label}
              </button>
            );
          })}
        </m.nav>
      )}
    </AnimatePresence>
  );
}
