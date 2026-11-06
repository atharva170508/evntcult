"use client";

import { useEffect, useId, useState } from "react";
import { motion } from "motion/react";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { applyTheme, THEME_KEY, type ThemeChoice } from "./theme";

const OPTIONS: { id: ThemeChoice; label: string; Icon: typeof Sun }[] = [
  { id: "light", label: "Light", Icon: Sun },
  { id: "system", label: "Device", Icon: Monitor },
  { id: "dark", label: "Dark", Icon: Moon },
];

/** Light / device / dark switch with a sliding thumb. */
export function ThemeToggle({ className }: { className?: string }) {
  const [choice, setChoice] = useState<ThemeChoice>("system");
  const uid = useId();

  // Keep every toggle on the page in sync (top bar + footer).
  useEffect(() => {
    const on = (e: Event) => setChoice((e as CustomEvent<ThemeChoice>).detail);
    window.addEventListener("ec-theme", on);
    return () => window.removeEventListener("ec-theme", on);
  }, []);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(THEME_KEY);
    } catch {}
    if (stored === "light" || stored === "dark") setChoice(stored);
  }, []);

  // Follow the device while on "Device".
  useEffect(() => {
    if (choice !== "system") return;
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const on = () => applyTheme("system");
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [choice]);

  function pick(next: ThemeChoice) {
    setChoice(next);
    applyTheme(next);
    window.dispatchEvent(new CustomEvent("ec-theme", { detail: next }));
    try {
      if (next === "system") localStorage.removeItem(THEME_KEY);
      else localStorage.setItem(THEME_KEY, next);
    } catch {}
  }

  return (
    <div role="radiogroup" aria-label="Colour theme" className={cn("inline-flex rounded-full border border-line bg-surface p-0.5", className)}>
      {OPTIONS.map(({ id, label, Icon }) => {
        const active = choice === id;
        return (
          <button
            key={id}
            role="radio"
            aria-checked={active}
            aria-label={label}
            title={label}
            onClick={() => pick(id)}
            className={cn("relative grid size-8 place-items-center rounded-full transition-colors", active ? "text-ink-contrast" : "text-ink-muted hover:text-ink")}
          >
            {active && <motion.span layoutId={`theme-thumb-${uid}`} className="absolute inset-0 rounded-full bg-ink" transition={{ type: "spring", bounce: 0.2, duration: 0.4 }} />}
            <Icon className="relative size-[15px]" />
          </button>
        );
      })}
    </div>
  );
}
