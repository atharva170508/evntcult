"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, m } from "motion/react";
import { ModalDialog } from "./ModalDialog";

/**
 * Linear / Gmail–style keyboard navigation chords + "?" shortcuts cheat sheet.
 *   G then H -> Home
 *   G then D -> Discover
 *   G then C -> Calendar
 *   G then P -> My Passes
 *   G then V -> Photo Vault
 *   G then N -> Host an Event (organizers only)
 *   E        -> Enter event code
 *   ?        -> Open shortcuts overlay
 */
export function KeyboardShortcuts({
  isOrganizer,
  signedIn,
  onEnterCode,
}: {
  isOrganizer: boolean;
  signedIn: boolean;
  onEnterCode: () => void;
}) {
  const router = useRouter();
  const [chord, setChord] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const chordTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const clearChord = () => {
      setChord(false);
      if (chordTimer.current) {
        clearTimeout(chordTimer.current);
        chordTimer.current = null;
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      const typing =
        !!t &&
        (t.isContentEditable ||
          t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.tagName === "SELECT");
      if (typing) return;

      const k = e.key.toLowerCase();

      if (e.key === "?") {
        e.preventDefault();
        clearChord();
        setHelpOpen((o) => !o);
        return;
      }

      if (e.key === "Escape") {
        clearChord();
        setHelpOpen(false);
        return;
      }

      if (chord) {
        clearChord();
        const routes: Record<string, string | undefined> = {
          h: "/dashboard",
          d: "/events",
          c: "/calendar",
          p: "/passes",
          v: "/vault",
          n: isOrganizer ? "/organizer/events/new" : undefined,
        };
        const dest = routes[k];
        if (dest) {
          e.preventDefault();
          router.push(dest);
        }
        return;
      }

      if (k === "g") {
        setChord(true);
        if (chordTimer.current) clearTimeout(chordTimer.current);
        chordTimer.current = setTimeout(() => setChord(false), 1200);
      } else if (k === "e" && signedIn) {
        e.preventDefault();
        onEnterCode();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearChord();
    };
  }, [chord, isOrganizer, signedIn, onEnterCode, router]);

  const rows: { keys: string[]; label: string }[] = [
    { keys: ["⌘K", "/"], label: "Quick search & actions" },
    ...(signedIn ? [{ keys: ["E"], label: "Enter an event code" }] : []),
    { keys: ["G", "H"], label: "Go to Home" },
    { keys: ["G", "D"], label: "Go to Discover" },
    { keys: ["G", "C"], label: "Go to Calendar" },
    { keys: ["G", "P"], label: "Go to My Passes" },
    { keys: ["G", "V"], label: "Go to Photo Vault" },
    ...(isOrganizer ? [{ keys: ["G", "N"], label: "Host a new event" }] : []),
    { keys: ["?"], label: "Toggle this shortcuts menu" },
  ];

  return (
    <>
      <AnimatePresence>
        {chord && (
          <m.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.14 }}
            className="pointer-events-none fixed bottom-6 left-6 z-50 hidden items-center gap-2 rounded-full bg-ink px-3.5 py-2 text-[12.5px] font-semibold text-[#FFFEF6] shadow-raised md:inline-flex print:hidden"
          >
            <kbd className="rounded bg-white/15 px-1.5 py-0.5 font-mono text-[11px]">G</kbd>
            <span className="text-[#FFFEF6]/75">then H · D · C · P · V{isOrganizer ? " · N" : ""}</span>
          </m.div>
        )}
      </AnimatePresence>

      {helpOpen && (
        <ModalDialog
          onClose={() => setHelpOpen(false)}
          label="Keyboard shortcuts"
          className="print:hidden"
        >
          <button
            aria-label="Close shortcuts"
            onClick={() => setHelpOpen(false)}
            className="absolute inset-0 bg-night/45 backdrop-blur-[3px]"
          />
          <div className="relative mx-auto mt-[14vh] w-[calc(100%-32px)] max-w-[440px] rounded-[20px] border border-line-strong bg-surface p-6 shadow-pop">
            <div className="flex items-baseline justify-between border-b border-line pb-3">
              <h2 className="font-display text-[26px] leading-none text-ink">Keyboard shortcuts</h2>
              <span className="font-mono text-[11.5px] text-ink-muted">Esc to close</span>
            </div>
            <ul className="mt-3 divide-y divide-line">
              {rows.map((r) => (
                <li key={r.label} className="flex items-center justify-between gap-4 py-2.5 text-[14px]">
                  <span className="text-ink-2">{r.label}</span>
                  <span className="flex items-center gap-1">
                    {r.keys.map((k) => (
                      <kbd key={k} className="kbd px-2 py-0.5 text-[11.5px]">
                        {k}
                      </kbd>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </ModalDialog>
      )}
    </>
  );
}
