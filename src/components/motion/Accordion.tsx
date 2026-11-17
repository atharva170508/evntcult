"use client";

import { AnimatePresence, m } from "motion/react";
import { useId, useState } from "react";
import { Plus } from "lucide-react";
import { EASE } from "./MotionProvider";

/** Questions and answers. One open at a time; answers open with a smooth height change. */
export function Accordion({ items }: { items: [string, string][] }) {
  const [open, setOpen] = useState<number | null>(null);
  const id = useId();
  return (
    <div className="divide-y divide-line-strong border-y border-line-strong">
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
                className="flex w-full items-center justify-between gap-6 py-5 text-left text-[18px] font-semibold text-ink"
              >
                {q}
                <m.span animate={{ rotate: isOpen ? 45 : 0 }} transition={{ duration: 0.3, ease: EASE }} className="grid size-8 shrink-0 place-items-center rounded-full border border-line-strong">
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
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.45, ease: EASE }}
                  className="overflow-hidden"
                >
                  <p className="max-w-[56ch] pb-6 text-[16px] leading-relaxed text-ink-2">{a}</p>
                </m.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
