"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, m } from "motion/react";
import { Check, Info, X } from "lucide-react";

type Toast = { id: number; message: string; tone?: "ok" | "info" | "error"; action?: { label: string; run: () => void }; ms?: number };
const EVT = "ec:toast";
let seq = 0;

/** Show a notice at the bottom of the screen. `action` adds a button such as Undo. */
export function toast(message: string, opts: Omit<Toast, "id" | "message"> = {}) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<Toast>(EVT, { detail: { id: ++seq, message, ...opts } }));
}

/** Mounted once in the root layout. Stacks up to three, newest at the bottom; hover pauses. */
export function Toaster() {
  const [items, setItems] = useState<Toast[]>([]);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const on = (e: Event) => setItems((xs) => [...xs.slice(-2), (e as CustomEvent<Toast>).detail]);
    window.addEventListener(EVT, on);
    return () => window.removeEventListener(EVT, on);
  }, []);
  useEffect(() => {
    if (paused || !items.length) return;
    const first = items[0];
    const t = setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== first.id)), first.ms ?? (first.action ? 6000 : 3600));
    return () => clearTimeout(t);
  }, [items, paused]);

  const drop = (id: number) => setItems((xs) => xs.filter((x) => x.id !== id));
  return (
    <div
      aria-live="polite"
      role="status"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      className="pointer-events-none fixed inset-x-0 bottom-[max(16px,env(safe-area-inset-bottom))] z-[90] flex flex-col items-center gap-2 px-4"
    >
      <AnimatePresence initial={false}>
        {items.map((t) => (
          <m.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97, transition: { duration: 0.14 } }}
            transition={{ type: "spring", stiffness: 520, damping: 36 }}
            className="pointer-events-auto flex min-h-11 max-w-[min(440px,100%)] items-center gap-3 rounded-[14px] bg-ink py-2 pl-3.5 pr-2 text-[13.5px] font-medium text-white shadow-[0_10px_30px_-8px_rgba(20,14,4,.45)]"
          >
            <span className="grid size-5 shrink-0 place-items-center rounded-full bg-white/15" aria-hidden>
              {t.tone === "error" ? <X className="size-3" /> : t.tone === "info" ? <Info className="size-3" /> : <Check className="size-3" />}
            </span>
            <span className="min-w-0 flex-1 py-1">{t.message}</span>
            {t.action && (
              <button
                type="button"
                onClick={() => {
                  t.action!.run();
                  drop(t.id);
                }}
                className="shrink-0 rounded-[10px] bg-white/12 px-3 py-1.5 text-[13px] font-semibold text-white hover:bg-white/20"
              >
                {t.action.label}
              </button>
            )}
            <button type="button" aria-label="Dismiss" onClick={() => drop(t.id)} className="grid size-7 shrink-0 place-items-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white">
              <X className="size-3.5" aria-hidden />
            </button>
          </m.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
