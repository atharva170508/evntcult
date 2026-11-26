"use client";

import { AnimatePresence, m } from "motion/react";
import { useId, useState } from "react";
import { Plus } from "lucide-react";
import { EASE, EASE_IN } from "./MotionProvider";

/** Questions and answers. One open at a time; answers open with a smooth height change. */
export function Accordion({ items, tone = "light" }: { items: [string, string][]; tone?: "light" | "dark" }) {
  const [open, setOpen] = useState<number | null>(null);
  const id = useId();
  const dark = tone === "dark";
  return (
    <div className={dark ? "divide-y divide-white/12 border-y border-white/12" : "divide-y divide-line-strong border-y border-line-strong"}>
      {items.map(([q, a], i) => {
        const isOpen = open === i;
        return (
          <div key={q}>
            <h3>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={`${id}-${i}`}
                onClick={() => setOpen(isOpen ? null : i)}
                className={`flex w-full cursor-pointer items-center justify-between gap-6 py-5 text-left text-[18px] font-semibold ${dark ? "text-[#EDE3DA]" : "text-ink"}`}
              >
                {q}
                <m.span
                  animate={{ rotate: isOpen ? 45 : 0 }}
                  transition={{ duration: 0.15, ease: EASE }}
                  className={`grid size-8 shrink-0 place-items-center rounded-full border ${dark ? "border-white/20 text-[#F0D7FF]" : "border-line-strong"}`}
                >
                  <Plus className="size-4" aria-hidden />
                </m.span>
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {isOpen && (
                <m.div
                  id={`${id}-${i}`}
                  role="region"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1, transition: { duration: 0.25, ease: EASE } }}
                  exit={{ height: 0, opacity: 0, transition: { duration: 0.17, ease: EASE_IN } }}
                  className="overflow-hidden"
                >
                  <p className={`max-w-[56ch] pb-6 text-[16px] leading-relaxed ${dark ? "text-[#EDE3DA]/70" : "text-ink-2"}`}>{a}</p>
                </m.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
