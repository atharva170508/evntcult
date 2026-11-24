"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { toast } from "@/components/ui/Toaster";

const AWAY_TITLES = [
  "Your pass is getting cold...",
  "Come back, the DJ just started",
  "Psst, don't miss the afterparty",
  "1 unread campus plan",
];

const STUBS = [
  { x: 10, rot: -22, delay: 0.0, bg: "#F0D7FF", ink: "#1A1A1A", label: "VIP" },
  { x: 24, rot: 14, delay: 0.08, bg: "#E3264F", ink: "#FFFEF6", label: "ADMIT 1" },
  { x: 39, rot: -11, delay: 0.04, bg: "#FFD27A", ink: "#1A1A1A", label: "BACKSTAGE" },
  { x: 54, rot: 19, delay: 0.12, bg: "#FFFEF6", ink: "#1A1A1A", label: "CULT" },
  { x: 69, rot: -16, delay: 0.06, bg: "#F0D7FF", ink: "#1A1A1A", label: "GUEST" },
  { x: 84, rot: 12, delay: 0.14, bg: "#E3264F", ink: "#FFFEF6", label: "PASS" },
];

/**
 * Tiny, unobtrusive delight layer mounted once in the root layout:
 * 1. Playful document.title when the user switches away to another browser tab.
 * 2. Secret "cult" keyboard easter egg (outside inputs) that rains a few tiny ticket stubs.
 */
export function PlayfulExtras() {
  const reduce = useReducedMotion();
  const [rainKey, setRainKey] = useState(0);
  const [raining, setRaining] = useState(false);
  const savedTitle = useRef<string>("");
  const awayTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rainTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const buffer = useRef("");

  // 1. Playful away tab title
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        savedTitle.current = document.title;
        awayTimer.current = setTimeout(() => {
          if (document.hidden) {
            const pick = AWAY_TITLES[Math.floor(Math.random() * AWAY_TITLES.length)];
            document.title = pick;
          }
        }, 1800);
      } else {
        if (awayTimer.current) {
          clearTimeout(awayTimer.current);
          awayTimer.current = null;
        }
        if (savedTitle.current) {
          document.title = savedTitle.current;
          savedTitle.current = "";
        }
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      if (awayTimer.current) clearTimeout(awayTimer.current);
    };
  }, []);

  // 2. Type "cult" anywhere (outside form inputs) to rain tiny ticket stubs
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.key.length !== 1) return;
      buffer.current = (buffer.current + e.key.toLowerCase()).slice(-4);
      if (buffer.current === "cult") {
        buffer.current = "";
        toast("Welcome to the cult. Attendance still not guaranteed.", { tone: "info", ms: 4200 });
        if (!reduce) {
          setRainKey((k) => k + 1);
          setRaining(true);
          if (rainTimer.current) clearTimeout(rainTimer.current);
          rainTimer.current = setTimeout(() => setRaining(false), 2100);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (rainTimer.current) clearTimeout(rainTimer.current);
    };
  }, [reduce]);

  return (
    <AnimatePresence>
      {raining && !reduce && (
        <div
          key={rainKey}
          aria-hidden
          className="pointer-events-none fixed inset-0 z-[95] overflow-hidden print:hidden"
        >
          {STUBS.map((s, idx) => (
            <m.span
              key={idx}
              initial={{ y: -60, opacity: 0, rotate: s.rot * 0.6 }}
              animate={{ y: "108vh", opacity: [0, 1, 1, 0], rotate: s.rot * 2.4 }}
              transition={{ duration: 1.75, delay: s.delay, ease: [0.22, 0.61, 0.36, 1] }}
              style={{ left: `${s.x}%`, backgroundColor: s.bg, color: s.ink }}
              className="absolute top-0 inline-flex items-center rounded-[6px] border border-dashed border-ink/25 px-2.5 py-1 font-mono text-[10px] font-bold tracking-[0.08em] shadow-card"
            >
              {s.label}
            </m.span>
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}
