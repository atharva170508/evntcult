"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { usePresence } from "@/lib/hooks/usePresence";
import { buttonClass } from "./Button";

export interface MenuItem {
  label: string;
  href?: string;
  onSelect?: () => void;
  danger?: boolean;
  disabled?: boolean;
}

/**
 * §8 Menu — opens in 140ms from its trigger. Items 36 tall (40 on touch), at most 360px wide.
 * More than nine items gets a search box. Keys: ↑ ↓ Home End, type a letter to jump, Enter to choose,
 * Esc closes and puts focus back on the trigger.
 */
export function Menu({ label, items, align = "start", triggerClassName }: { label: React.ReactNode; items: MenuItem[]; align?: "start" | "end"; triggerClassName?: string }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const { mounted, phase } = usePresence(open, 100);
  const trigger = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const typed = useRef({ text: "", at: 0 });
  const id = useId();

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? items.filter((i) => i.label.toLowerCase().includes(q)) : items;
  }, [items, query]);
  const withSearch = items.length > 9;

  const close = (refocus = true) => {
    setOpen(false);
    setQuery("");
    if (refocus) trigger.current?.focus();
  };

  // Focus the first item (or the search box) when opening.
  useEffect(() => {
    if (!open) return;
    setActive(0);
    requestAnimationFrame(() => (withSearch ? search.current?.focus() : list.current?.querySelector<HTMLElement>("[role=menuitem]")?.focus()));
  }, [open, withSearch]);

  // Click outside closes without stealing focus.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!list.current?.contains(e.target as Node) && !trigger.current?.contains(e.target as Node)) close(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  const focusItem = (i: number) => {
    const els = list.current?.querySelectorAll<HTMLElement>("[role=menuitem]");
    if (!els?.length) return;
    const n = (i + els.length) % els.length;
    setActive(n);
    els[n].focus();
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "Tab") close(false);
    else if (e.key === "ArrowDown") {
      e.preventDefault();
      focusItem(document.activeElement === search.current ? 0 : active + 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      focusItem(active - 1);
    } else if (e.key === "Home") {
      e.preventDefault();
      focusItem(0);
    } else if (e.key === "End") {
      e.preventDefault();
      focusItem(shown.length - 1);
    } else if (e.key.length === 1 && document.activeElement !== search.current && /\S/.test(e.key)) {
      // Type-ahead: letters typed within 500ms build up a prefix.
      const now = Date.now();
      typed.current = { text: (now - typed.current.at < 500 ? typed.current.text : "") + e.key.toLowerCase(), at: now };
      const i = shown.findIndex((it) => it.label.toLowerCase().startsWith(typed.current.text));
      if (i >= 0) focusItem(i);
    }
  };

  const choose = (it: MenuItem) => {
    if (it.disabled) return;
    it.onSelect?.();
    close();
  };

  return (
    <div className="relative inline-block" onKeyDown={open ? onKey : undefined}>
      <button
        ref={trigger}
        type="button"
        className={triggerClassName ?? buttonClass("secondary", "sm")}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={() => (open ? close() : setOpen(true))}
        onKeyDown={(e) => {
          if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
            e.preventDefault();
            setOpen(true);
          }
        }}
      >
        {label}
        <span aria-hidden className="text-ink-subtle">
          ⌄
        </span>
      </button>
      {mounted && (
        <div
          ref={list}
          id={id}
          role="menu"
          data-phase={phase}
          className={cn(
            "ec-menu absolute z-50 mt-1 min-w-48 max-w-[360px] rounded-md border border-line-strong bg-surface-2 p-1 shadow-overlay",
            align === "end" ? "right-0 origin-top-right" : "left-0 origin-top-left",
          )}
        >
          {withSearch && (
            <input
              ref={search}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              aria-label="Search the menu"
              className="mb-1 h-9 w-full rounded-sm border border-line bg-surface px-2 text-body-sm text-ink placeholder:text-ink-subtle"
            />
          )}
          {shown.length === 0 && <p className="px-2 py-2 text-body-sm text-ink-muted">No matches.</p>}
          {shown.map((it, i) => {
            const cls = cn(
              "flex h-9 w-full items-center rounded-sm px-2 text-left text-body-sm outline-offset-0 [@media(pointer:coarse)]:h-10",
              it.danger ? "text-bad" : "text-ink",
              it.disabled ? "cursor-not-allowed text-ink-subtle" : "hover:bg-white/[0.06] focus-visible:bg-white/[0.06]",
            );
            return it.href && !it.disabled ? (
              <Link key={it.label} href={it.href} role="menuitem" tabIndex={i === active ? 0 : -1} className={cls} onClick={() => close(false)}>
                {it.label}
              </Link>
            ) : (
              <button key={it.label} type="button" role="menuitem" tabIndex={i === active ? 0 : -1} aria-disabled={it.disabled || undefined} className={cls} onClick={() => choose(it)}>
                {it.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
