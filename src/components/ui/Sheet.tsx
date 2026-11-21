"use client";

import { m } from "motion/react";
import { X } from "lucide-react";
import { ModalDialog } from "@/components/ui/ModalDialog";
import { EASE } from "@/components/motion/MotionProvider";

/**
 * A native <dialog> that rises from the bottom on phones and slides in from the right on
 * larger screens. Focus is trapped, the page behind is inert, Escape and the backdrop close it.
 */
export function Sheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <ModalDialog label={title} onClose={onClose}>
      <m.button
        type="button"
        aria-label="Close"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-ink/40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      />
      <m.div
        role="document"
        className="absolute inset-x-0 bottom-0 max-h-[92dvh] overflow-y-auto rounded-t-[24px] bg-canvas pb-[env(safe-area-inset-bottom)] shadow-pop md:inset-y-0 md:left-auto md:right-0 md:max-h-none md:w-[440px] md:rounded-none md:rounded-l-[24px]"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: EASE }}
      >
        <div className="sticky top-0 z-10 border-b border-line bg-canvas">
          <div className="flex justify-center pt-2 md:hidden" aria-hidden>
            <span className="h-1 w-10 rounded-full bg-line-strong" />
          </div>
          <div className="flex items-center justify-between gap-3 py-1.5 pl-5 pr-2 md:py-3">
            <h2 className="text-[16px] font-semibold text-ink">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="grid size-11 place-items-center rounded-lg text-ink-2 transition-colors duration-fast hover:bg-sunken hover:text-ink"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>
        </div>
        <div className="p-5">{children}</div>
      </m.div>
    </ModalDialog>
  );
}
