"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

type Theme = "light" | "dark" | "system";
const KEY = "ec_theme";

/** Apply a theme to <html>. "system" follows the device setting, live. */
export function applyTheme(t: Theme) {
  const dark = t === "dark" || (t === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? "#141311" : "#FFFEF6");
}

/** Light, Dark or System, remembered on this device. */
export function ThemeSwitch({ className }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>("light");
  useEffect(() => {
    try {
      setTheme((localStorage.getItem(KEY) as Theme) || "light");
    } catch {
      // private mode
    }
  }, []);
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const on = () => applyTheme("system");
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [theme]);

  const pick = (t: Theme) => {
    setTheme(t);
    try {
      localStorage.setItem(KEY, t);
    } catch {
      // private mode
    }
    applyTheme(t);
  };

  const opts: [Theme, string, typeof Sun][] = [
    ["light", "Light", Sun],
    ["dark", "Dark", Moon],
    ["system", "System", Monitor],
  ];
  return (
    <div role="radiogroup" aria-label="Appearance" className={cn("grid grid-cols-3 gap-1 rounded-xl bg-sunken p-1", className)}>
      {opts.map(([v, l, Icon]) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={theme === v}
          onClick={() => pick(v)}
          className={cn(
            "flex h-8 items-center justify-center gap-1.5 rounded-lg text-[12.5px] font-semibold transition-colors",
            theme === v ? "bg-surface text-ink shadow-[0_1px_2px_rgba(0,0,0,0.12),0_0_0_1px_var(--hair)]" : "text-ink-muted hover:text-ink",
          )}
        >
          <Icon className="size-3.5" aria-hidden /> {l}
        </button>
      ))}
    </div>
  );
}

/** Compact 1-click Light <-> Dark toggle for the top header bar. */
export function ThemeToggle({ className }: { className?: string }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const sync = () => setDark(document.documentElement.classList.contains("dark"));
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  const flip = () => {
    const next: Theme = dark ? "light" : "dark";
    try {
      localStorage.setItem(KEY, next);
    } catch {
      // private mode
    }
    applyTheme(next);
    setDark(next === "dark");
  };

  return (
    <button
      type="button"
      onClick={flip}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
      className={cn(
        "ui-press grid size-9 shrink-0 place-items-center rounded-full border border-line-strong/80 bg-surface text-ink transition-[border-color,background-color,transform] duration-fast hover:border-ink-subtle hover:bg-sunken",
        className,
      )}
    >
      {dark ? (
        <Sun className="size-4" strokeWidth={2} aria-hidden />
      ) : (
        <Moon className="size-4" strokeWidth={2} aria-hidden />
      )}
    </button>
  );
}

/** Inline, before first paint: sets .dark so the page never flashes the wrong theme. */
export const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('${KEY}')||'light';var d=t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark')}catch(e){}})()`;
