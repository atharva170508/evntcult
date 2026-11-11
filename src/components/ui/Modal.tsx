"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { usePresence } from "@/lib/hooks/usePresence";

/**
 * §8 Modal — a native <dialog>, so focus stays inside and the page behind is inert.
 * 280ms entrance, 50% backdrop with a 2px blur. Esc closes and focus returns to whatever opened it.
 */
export function Modal({ open, onClose, title, children, className }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const { mounted, phase } = usePresence(open, 200);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      opener.current = document.activeElement as HTMLElement | null;
      d.showModal();
    }
  }, [open, mounted]);

  useEffect(() => {
    const d = ref.current;
    if (!mounted && d?.open) d.close();
    if (!mounted) opener.current?.focus();
  }, [mounted]);

  if (!mounted) return null;
  return (
    <dialog
      ref={ref}
      data-phase={phase}
      aria-labelledby="modal-title"
      className={cn("ec-modal m-auto w-[min(560px,calc(100vw-32px))] rounded-lg border border-line-strong bg-surface p-0 text-ink shadow-overlay", className)}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex items-center justify-between gap-4 border-b border-line px-6 py-4">
        <h2 id="modal-title" className="text-title">
          {title}
        </h2>
        <button type="button" onClick={onClose} className="press -mr-2 h-10 rounded-sm px-2 text-body-sm text-ink-muted hover:text-ink">
          Close
        </button>
      </div>
      <div className="px-6 py-6">{children}</div>
    </dialog>
  );
}
