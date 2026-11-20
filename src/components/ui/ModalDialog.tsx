"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * A full-screen native <dialog> opened with showModal(): the browser traps focus inside,
 * makes the page behind inert, and Escape closes it. Mount it to open, unmount to close.
 */
export function ModalDialog({ label, onClose, className, children }: { label: string; onClose: () => void; className?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (!d.open) d.showModal();
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = "";
      if (d.open) d.close();
    };
  }, []);

  return (
    <dialog
      ref={ref}
      aria-label={label}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      className={cn("fixed inset-0 !m-0 h-dvh max-h-none w-full max-w-none overflow-visible bg-transparent p-0 text-ink backdrop:bg-transparent", className)}
    >
      {children}
    </dialog>
  );
}
