"use client";

import { m, useDragControls, type PanInfo } from "motion/react";
import { ModalDialog } from "./ModalDialog";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * A phone sheet that rises from the bottom edge, where the thumb already is. Drag the handle
 * (or the top of the sheet) down, tap outside, or press Escape to close. Mount to open.
 */
export function BottomSheet({
  label,
  onClose,
  title,
  children,
  className,
}: {
  label: string;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  const drag = useDragControls();

  function end(_: unknown, info: PanInfo) {
    if (info.offset.y > 90 || info.velocity.y > 500) onClose();
  }

  return (
    <ModalDialog label={label} onClose={onClose}>
      <m.button
        type="button"
        aria-label="Close"
        tabIndex={-1}
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 cursor-default bg-ink/35"
      />
      <m.div
        role="document"
        drag="y"
        dragListener={false}
        dragControls={drag}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.05, bottom: 0.9 }}
        onDragEnd={end}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        transition={{ duration: 0.32, ease: EASE }}
        className={cn(
          "fixed inset-x-0 bottom-0 flex max-h-[88dvh] flex-col rounded-t-[28px] bg-canvas text-ink shadow-[0_-12px_40px_-12px_rgba(40,25,5,0.35)]",
          className,
        )}
      >
        <div
          onPointerDown={(e) => drag.start(e)}
          className="shrink-0 cursor-grab touch-none px-5 pb-2 pt-2.5 active:cursor-grabbing"
        >
          <span aria-hidden className="mx-auto block h-[5px] w-10 rounded-full bg-line-strong" />
          {title && <div className="mt-3 text-[17px] font-semibold">{title}</div>}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-[calc(20px+env(safe-area-inset-bottom))]">
          {children}
        </div>
      </m.div>
    </ModalDialog>
  );
}
