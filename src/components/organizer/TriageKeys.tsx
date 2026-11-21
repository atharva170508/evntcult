"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, m } from "motion/react";
import { EASE } from "@/components/motion/MotionProvider";

type Last = { regId: string; name: string; kind: "paid" | "rejected"; utr: string };

const isMac = () => typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

/**
 * Keyboard triage for the guest table, Linear style: J/K (or arrows) move, A marks a UPI payment
 * received, R marks it not received, Ctrl/Cmd+Z undoes the last one. Rows opt in with
 * data-triage-row, data-reg, data-name and data-utr (set only while a payment awaits checking).
 */
export function TriageKeys({ tableId }: { tableId: string }) {
  const router = useRouter();
  const [index, setIndex] = useState(-1);
  const [toast, setToast] = useState<{ text: string; undo: boolean; error?: boolean } | null>(null);
  const last = useRef<Last | null>(null);
  const busy = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const rows = useCallback(() => [...(document.getElementById(tableId)?.querySelectorAll<HTMLElement>("[data-triage-row]") ?? [])], [tableId]);

  // Paint the selection.
  useEffect(() => {
    rows().forEach((r, i) => {
      if (i === index) {
        r.dataset.selected = "true";
        r.scrollIntoView({ block: "nearest" });
      } else delete r.dataset.selected;
    });
  });

  const show = useCallback((t: { text: string; undo: boolean; error?: boolean }) => {
    setToast(t);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), t.undo ? 6000 : 3500);
  }, []);

  const send = useCallback(async (regId: string, body: object) => {
    const res = await fetch(`/api/registrations/${regId}/payment`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(() => null);
    if (!res?.ok) {
      const data = (await res?.json().catch(() => null)) as { error?: { message?: string } } | null;
      throw new Error(data?.error?.message ?? (res ? "Didn't save." : "You're offline."));
    }
  }, []);

  const act = useCallback(
    async (kind: "paid" | "rejected") => {
      const row = rows()[index];
      const utr = row?.dataset.utr;
      if (!row || !utr || busy.current) {
        if (row && !utr) show({ text: "Nothing to check on this row.", undo: false });
        return;
      }
      busy.current = true;
      const regId = row.dataset.reg!;
      const name = row.dataset.name ?? "Guest";
      try {
        await send(regId, kind === "paid" ? { status: "paid", method: "upi" } : { status: "rejected" });
        last.current = { regId, name, kind, utr };
        show({ text: kind === "paid" ? `${name}: payment received` : `${name}: payment not received`, undo: true });
        router.refresh();
      } catch (e) {
        show({ text: (e as Error).message, undo: false, error: true });
      } finally {
        busy.current = false;
      }
    },
    [index, rows, router, send, show],
  );

  const undo = useCallback(async () => {
    const l = last.current;
    if (!l || busy.current) return;
    busy.current = true;
    try {
      await send(l.regId, l.kind === "paid" ? { status: "unpaid" } : { status: "restore_claim", utr: l.utr });
      last.current = null;
      show({ text: `Undone. ${l.name} is back to “To verify”.`, undo: false });
      router.refresh();
    } catch (e) {
      show({ text: (e as Error).message, undo: false, error: true });
    } finally {
      busy.current = false;
    }
  }, [router, send, show]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement | null;
      if (el && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName))) return;
      if (document.querySelector("dialog[open]")) return;
      const k = e.key.toLowerCase();
      if ((e.metaKey || e.ctrlKey) && k === "z") {
        if (last.current) {
          e.preventDefault();
          void undo();
        }
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const n = rows().length;
      if (!n) return;
      if (k === "j" || k === "arrowdown") {
        e.preventDefault();
        setIndex((i) => Math.min(n - 1, i + 1));
      } else if (k === "k" || k === "arrowup") {
        if (index < 0) return;
        e.preventDefault();
        setIndex((i) => Math.max(0, i - 1));
      } else if (k === "escape") setIndex(-1);
      else if (k === "a" && index >= 0) void act("paid");
      else if (k === "r" && index >= 0) void act("rejected");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [act, index, rows, undo]);

  const mod = isMac() ? "⌘" : "Ctrl";
  const Key = ({ children }: { children: React.ReactNode }) => (
    <kbd className="inline-grid min-w-[22px] place-items-center rounded-md border border-line-strong bg-white px-1.5 py-0.5 font-mono text-[11px] text-ink-2 shadow-[0_1px_0_#DCD6C6]">{children}</kbd>
  );

  return (
    <>
      <p className="hidden items-center gap-x-4 gap-y-1 border-b border-line px-4 py-2 text-[12.5px] text-ink-muted md:flex md:flex-wrap" aria-label="Keyboard shortcuts">
        <span className="flex items-center gap-1">
          <Key>J</Key>
          <Key>K</Key> move
        </span>
        <span className="flex items-center gap-1">
          <Key>A</Key> received
        </span>
        <span className="flex items-center gap-1">
          <Key>R</Key> not received
        </span>
        <span className="flex items-center gap-1">
          <Key>{mod}</Key>
          <Key>Z</Key> undo
        </span>
        <span className="flex items-center gap-1">
          <Key>/</Key> search
        </span>
      </p>
      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4" aria-live="polite">
        <AnimatePresence>
          {toast && (
            <m.div
              key={toast.text}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8, transition: { duration: 0.15, ease: [0.4, 0, 1, 1] } }}
              transition={{ duration: 0.2, ease: EASE }}
              className={`pointer-events-auto flex items-center gap-3 rounded-xl px-4 py-3 text-[14px] text-white shadow-pop ${toast.error ? "bg-danger" : "bg-ink"}`}
            >
              <span>{toast.text}</span>
              {toast.undo && (
                <button type="button" onClick={() => void undo()} className="rounded-md bg-white/15 px-2.5 py-1 text-[13px] font-semibold transition-colors duration-fast hover:bg-white/25">
                  Undo <span className="ml-1 font-mono text-[11px] text-white/70">{mod} Z</span>
                </button>
              )}
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
