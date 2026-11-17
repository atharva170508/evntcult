"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CalendarDays, Search, Sparkles, Ticket, X } from "lucide-react";
import { CATEGORY_NAMES } from "./categories";

const QUICK = [
  { label: "Happening today", href: "/events?when=today", icon: CalendarDays },
  { label: "This weekend", href: "/events?when=weekend", icon: Sparkles },
  { label: "Free entry", href: "/events?price=free", icon: Ticket },
];

/**
 * Command search. Opens from the header, Ctrl/⌘ K or "/". Typing and Enter searches events;
 * the shortcuts below jump straight into a filtered list.
 */
export function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => input.current?.focus(), 30);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const go = (href: string) => {
    onClose();
    router.push(href);
  };

  return (
    <div className="fixed inset-0 z-[60] print:hidden" role="dialog" aria-modal="true" aria-label="Search events">
      <button aria-label="Close search" onClick={onClose} className="absolute inset-0 bg-night/45 backdrop-blur-[3px] motion-safe:animate-fade-in" />
      <div className="relative mx-auto mt-0 w-full max-w-[640px] px-0 sm:mt-[12vh] sm:px-4">
        <div className="overflow-hidden bg-white shadow-pop motion-safe:animate-scale-in sm:rounded-[20px]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const q = input.current?.value.trim();
              go(q ? `/events?q=${encodeURIComponent(q)}` : "/events");
            }}
            className="flex items-center gap-3 border-b border-line px-5"
          >
            <Search className="size-5 shrink-0 text-ink-subtle" aria-hidden />
            <input
              ref={input}
              name="q"
              type="search"
              autoComplete="off"
              placeholder="Search events, clubs, venues"
              aria-label="Search events"
              className="h-16 min-w-0 flex-1 bg-transparent text-[17px] text-ink outline-none placeholder:text-ink-subtle [&::-webkit-search-cancel-button]:hidden"
            />
            <button type="button" onClick={onClose} className="grid size-9 shrink-0 place-items-center rounded-[10px] text-ink-muted transition-colors hover:bg-sunken hover:text-ink" aria-label="Close">
              <X className="size-[18px]" aria-hidden />
            </button>
          </form>

          <div className="max-h-[70dvh] overflow-y-auto p-3">
            <p className="px-3 pb-2 pt-2 text-[12.5px] font-semibold text-ink-subtle">Jump to</p>
            <ul>
              {QUICK.map((q) => (
                <li key={q.href}>
                  <button
                    onClick={() => go(q.href)}
                    className="group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[15px] font-medium text-ink transition-colors hover:bg-sunken focus-visible:bg-sunken"
                  >
                    <span className="grid size-9 place-items-center rounded-[10px] bg-sunken text-ink-2 transition-colors group-hover:bg-white">
                      <q.icon className="size-[17px]" aria-hidden />
                    </span>
                    {q.label}
                    <ArrowRight className="ml-auto size-4 text-ink-subtle opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
            <p className="px-3 pb-2 pt-4 text-[12.5px] font-semibold text-ink-subtle">Browse by kind</p>
            <div className="flex flex-wrap gap-2 px-3 pb-3">
              {Object.entries(CATEGORY_NAMES).map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => go(`/events?type=${k}`)}
                  className="h-9 rounded-[10px] border border-line px-3.5 text-[14px] font-medium text-ink-2 transition-colors hover:border-ink-subtle hover:text-ink"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="hidden items-center gap-4 border-t border-line bg-sunken/60 px-5 py-3 text-[12.5px] text-ink-subtle sm:flex">
            <span>
              <span className="kbd">Enter</span> to search
            </span>
            <span>
              <span className="kbd">Esc</span> to close
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
