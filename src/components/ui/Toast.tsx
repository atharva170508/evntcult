"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { usePresence } from "@/lib/hooks/usePresence";

/**
 * §8 Toast — one at a time, 5 seconds, an optional action inside, announced politely.
 * Anything that needs a decision is never a toast.
 */
export interface ToastMessage {
  message: string;
  action?: { label: string; run: () => void };
  /** 4000–6000ms. */
  ms?: number;
}

const Ctx = createContext<(t: ToastMessage) => void>(() => {});
export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [key, setKey] = useState(0);
  const show = useCallback((t: ToastMessage) => {
    setToast(t);
    setKey((k) => k + 1);
  }, []);
  return (
    <Ctx.Provider value={show}>
      {children}
      <ToastView key={key} toast={toast} onDone={() => setToast(null)} />
    </Ctx.Provider>
  );
}

export function ToastView({ toast, onDone }: { toast: ToastMessage | null; onDone: () => void }) {
  const [open, setOpen] = useState(!!toast);
  const { mounted, phase } = usePresence(open, 130);
  const last = useRef(toast);
  const shown = useRef(false);
  if (toast) last.current = toast;
  if (mounted) shown.current = true;
  useEffect(() => {
    if (!toast) return;
    setOpen(true);
    const t = setTimeout(() => setOpen(false), Math.min(6000, Math.max(4000, toast.ms ?? 5000)));
    return () => clearTimeout(t);
  }, [toast]);
  // Tell the owner once this toast has been seen and has finished leaving.
  useEffect(() => {
    if (!mounted && toast && shown.current) {
      shown.current = false;
      onDone();
    }
  }, [mounted, toast, onDone]);
  const t = last.current;
  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex justify-center px-4 pb-[env(safe-area-inset-bottom)]">
      {mounted && t && (
        <div data-phase={phase} className="ec-toast pointer-events-auto flex items-center gap-4 rounded-md border border-line-strong bg-surface-3 px-4 py-3 text-body-sm text-ink shadow-overlay">
          <span>{t.message}</span>
          {t.action && (
            <button
              type="button"
              className="press font-semibold text-accent underline-offset-4 hover:underline"
              onClick={() => {
                t.action!.run();
                setOpen(false);
              }}
            >
              {t.action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
