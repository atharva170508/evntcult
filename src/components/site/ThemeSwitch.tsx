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

/** Inline, before first paint: sets .dark so the page never flashes the wrong theme. */
export const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('${KEY}')||'light';var d=t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark')}catch(e){}})()`;
