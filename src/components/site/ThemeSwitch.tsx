"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

type Theme = "dark" | "light" | "system";
const KEY = "ec_theme_v2";

/** Apply dark (default record-sleeve ink) or light (archival paper) to <html>. */
export function applyTheme(t: Theme) {
  const light = t === "light" || (t === "system" && window.matchMedia("(prefers-color-scheme: light)").matches);
  document.documentElement.classList.toggle("light", light);
  document.documentElement.classList.toggle("dark", !light);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", light ? "#EEE8DD" : "#151412");
}

/** Dark (default), Paper, or System, remembered on this device. */
export function ThemeSwitch({ className }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>("dark");
  useEffect(() => {
    try {
      setTheme((localStorage.getItem(KEY) as Theme) || "dark");
    } catch {
      // private mode
    }
  }, []);
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: light)");
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

  const opts: [Theme, string, typeof Moon][] = [
    ["dark", "Ink", Moon],
    ["light", "Paper", Sun],
    ["system", "Auto", Monitor],
  ];
  return (
    <div
      role="radiogroup"
      aria-label="Appearance"
      className={cn(
        "grid grid-cols-3 gap-1 rounded-[8px] border border-line bg-surface p-1",
        className,
      )}
    >
      {opts.map(([v, l, Icon]) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={theme === v}
          onClick={() => pick(v)}
          className={cn(
            "flex h-8 items-center justify-center gap-1.5 rounded-[6px] font-mono text-[11px] uppercase tracking-[0.06em] transition-colors",
            theme === v
              ? "bg-[#C9A26B] text-[#151412]"
              : "text-ink-muted hover:text-ink",
          )}
        >
          <Icon className="size-3" aria-hidden /> {l}
        </button>
      ))}
    </div>
  );
}

/** Compact 1-click Ink <-> Paper toggle. */
export function ThemeToggle({ className }: { className?: string }) {
  const [light, setLight] = useState(false);

  useEffect(() => {
    const sync = () => setLight(document.documentElement.classList.contains("light"));
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  const flip = () => {
    const next: Theme = light ? "dark" : "light";
    try {
      localStorage.setItem(KEY, next);
    } catch {
      // private mode
    }
    applyTheme(next);
    setLight(next === "light");
  };

  return (
    <button
      type="button"
      onClick={flip}
      aria-label={light ? "Switch to ink mode" : "Switch to paper mode"}
      title={light ? "Ink mode" : "Paper mode"}
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-full border border-line bg-transparent text-ink transition-colors hover:border-[#C9A26B] hover:text-[#C9A26B]",
        className,
      )}
    >
      {light ? <Moon className="size-3.5" aria-hidden /> : <Sun className="size-3.5" aria-hidden />}
    </button>
  );
}

/** Inline, before first paint: defaults to dark-led record sleeve (.dark), honours saved light preference. */
export const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('${KEY}')||'dark';var l=t==='light'||(t==='system'&&matchMedia('(prefers-color-scheme: light)').matches);document.documentElement.classList.toggle('light',l);document.documentElement.classList.toggle('dark',!l)}catch(e){document.documentElement.classList.add('dark')}try{var h=document.documentElement,u=navigator.userAgent;h.dataset.platform=/iPhone|iPad|iPod/.test(u)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1)?'ios':/Android/.test(u)?'android':'other';if(matchMedia('(display-mode: standalone)').matches||navigator.standalone)h.dataset.standalone=''}catch(e){}})()`;
