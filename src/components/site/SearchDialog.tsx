"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Award,
  CalendarDays,
  CalendarRange,
  Compass,
  CornerDownLeft,
  House,
  LayoutGrid,
  Plus,
  Search,
  Sparkles,
  Ticket,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { CATEGORY_NAMES } from "./categories";
import { ModalDialog } from "@/components/ui/ModalDialog";
import { fmtDate, fmtTime } from "@/lib/utils";

interface Item {
  id: string;
  group: "Events" | "Recent" | "Go to" | "Hosting" | "Browse";
  label: string;
  hint?: string;
  href: string;
  icon?: LucideIcon;
  /** For event results: date line. */
  meta?: string;
}

interface Found {
  slug: string;
  title: string;
  venue: string | null;
  starts_at: string;
  price_paise: number;
  seats_left: number | null;
}

const RECENT_KEY = "ec_recent_events";
const readRecent = (): Item[] => {
  try {
    return (JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]") as Item[]).slice(0, 4);
  } catch {
    return [];
  }
};
const saveRecent = (it: Item) => {
  try {
    const next = [it, ...readRecent().filter((r) => r.href !== it.href)].slice(0, 4).map((r) => ({ ...r, group: "Recent" as const }));
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // private mode
  }
};

const PAGES: Item[] = [
  { id: "p-home", group: "Go to", label: "Home", href: "/dashboard", icon: House },
  { id: "p-disc", group: "Go to", label: "Discover events", href: "/events", icon: Compass },
  { id: "p-today", group: "Go to", label: "Happening today", href: "/events?when=today", icon: Sparkles },
  { id: "p-free", group: "Go to", label: "Free events", href: "/events?price=free", icon: Ticket },
  { id: "p-cal", group: "Go to", label: "My calendar", href: "/calendar", icon: CalendarDays },
  { id: "p-pass", group: "Go to", label: "My passes", href: "/passes", icon: Ticket },
  { id: "p-cert", group: "Go to", label: "Certificates", href: "/certificates", icon: Award },
  { id: "p-prof", group: "Go to", label: "Profile", href: "/profile", icon: UserRound },
];
const HOSTING: Item[] = [
  { id: "h-new", group: "Hosting", label: "Create an event", href: "/organizer/events/new", icon: Plus },
  { id: "h-ev", group: "Hosting", label: "My hosted events", href: "/organizer", icon: LayoutGrid },
  { id: "h-cal", group: "Hosting", label: "Hosting calendar", href: "/organizer/calendar", icon: CalendarRange },
];

/**
 * The command palette. Ctrl/⌘ K or "/" from anywhere. Type to see matching events live, or jump
 * to any page; organizers also get their hosting shortcuts. Arrow keys move a highlight that
 * glides between rows; Enter opens; Esc closes. Recently opened events show first.
 */
export function SearchDialog({ open, onClose, isOrganizer = false }: { open: boolean; onClose: () => void; isOrganizer?: boolean }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const pill = useRef<HTMLSpanElement>(null);
  const [q, setQ] = useState("");
  const [found, setFound] = useState<Found[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const [recent, setRecent] = useState<Item[]>([]);

  useEffect(() => {
    if (!open) return;
    setQ("");
    setFound(null);
    setActive(0);
    setRecent(readRecent());
    const t = window.setTimeout(() => input.current?.focus(), 30);
    return () => window.clearTimeout(t);
  }, [open]);

  // Live event search, debounced; stale answers are dropped.
  useEffect(() => {
    const term = q.trim();
    if (!open || term.length < 2) {
      setFound(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const ctrl = new AbortController();
    const t = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/events?q=${encodeURIComponent(term)}`, { signal: ctrl.signal });
        const data = (await res.json()) as { events?: Found[] };
        setFound((data.events ?? []).slice(0, 6));
      } catch {
        if (!ctrl.signal.aborted) setFound([]);
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, 160);
    return () => {
      ctrl.abort();
      window.clearTimeout(t);
    };
  }, [q, open]);

  const items = useMemo<Item[]>(() => {
    const term = q.trim().toLowerCase();
    const match = (it: Item) => !term || it.label.toLowerCase().includes(term);
    const events: Item[] = (found ?? []).map((e) => ({
      id: `e-${e.slug}`,
      group: "Events",
      label: e.title,
      href: `/events/${e.slug}`,
      meta: `${fmtDate(new Date(e.starts_at), { weekday: "short", day: "numeric", month: "short" })}, ${fmtTime(new Date(e.starts_at))}${e.venue ? `, ${e.venue}` : ""}`,
      hint: e.seats_left === 0 ? "Full" : e.price_paise ? `₹${Math.round(e.price_paise / 100).toLocaleString("en-IN")}` : "Free",
    }));
    const kinds: Item[] = Object.entries(CATEGORY_NAMES).map(([k, label]) => ({ id: `k-${k}`, group: "Browse", label, href: `/events?type=${k}`, icon: Compass }));
    const search: Item[] = term ? [{ id: "s-all", group: "Events", label: `Search all events for "${q.trim()}"`, href: `/events?q=${encodeURIComponent(q.trim())}`, icon: Search }] : [];
    return [
      ...(term ? [] : recent),
      ...events,
      ...search,
      ...(isOrganizer ? HOSTING.filter(match) : []),
      ...PAGES.filter(match),
      ...(term ? kinds.filter(match) : []),
    ];
  }, [q, found, recent, isOrganizer]);

  useEffect(() => setActive(0), [q, found]);

  // Glide the highlight to the active row.
  useLayoutEffect(() => {
    const el = list.current?.querySelector<HTMLElement>(`[data-i="${active}"]`);
    if (!el || !pill.current) return;
    pill.current.style.opacity = "1";
    pill.current.style.transform = `translateY(${el.offsetTop}px)`;
    pill.current.style.height = `${el.offsetHeight}px`;
    el.scrollIntoView({ block: "nearest" });
  }, [active, items]);

  if (!open) return null;

  const go = (it: Item) => {
    if (it.group === "Events" && it.id.startsWith("e-")) saveRecent(it);
    if (it.group === "Recent") saveRecent(it);
    onClose();
    router.push(it.href);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") (e.preventDefault(), setActive((a) => Math.min(items.length - 1, a + 1)));
    else if (e.key === "ArrowUp") (e.preventDefault(), setActive((a) => Math.max(0, a - 1)));
    else if (e.key === "Enter") {
      e.preventDefault();
      const it = items[active];
      if (it) go(it);
      else if (q.trim()) go({ id: "s", group: "Events", label: q, href: `/events?q=${encodeURIComponent(q.trim())}` });
    }
  };

  let lastGroup = "";
  return (
    <ModalDialog label="Search" onClose={onClose} className="print:hidden">
      <button aria-label="Close search" onClick={onClose} className="absolute inset-0 bg-night/45 backdrop-blur-[3px] motion-safe:animate-fade-in" />
      <div className="relative mx-auto mt-0 w-full max-w-[640px] px-0 sm:mt-[12vh] sm:px-4">
        <div className="overflow-hidden bg-white shadow-pop motion-safe:animate-scale-in sm:rounded-[20px]">
          <div className="flex items-center gap-3 border-b border-line px-5">
            <Search className="size-5 shrink-0 text-ink-subtle" aria-hidden />
            <input
              ref={input}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={onKey}
              type="search"
              role="combobox"
              aria-expanded="true"
              aria-controls="cmdk-list"
              aria-activedescendant={items[active] ? `cmdk-${items[active].id}` : undefined}
              autoComplete="off"
              placeholder="Search events, or jump to a page"
              aria-label="Search events or jump to a page"
              className="h-16 min-w-0 flex-1 bg-transparent text-[17px] text-ink outline-none placeholder:text-ink-subtle focus-visible:shadow-none [&::-webkit-search-cancel-button]:hidden"
            />
            {loading && <span className="size-4 shrink-0 animate-spin rounded-full border-2 border-line-strong border-t-ink" aria-hidden />}
            <span className="kbd hidden sm:inline-flex">Esc</span>
          </div>

          <div ref={list} id="cmdk-list" role="listbox" aria-label="Results" className="relative max-h-[60dvh] overflow-y-auto p-2">
            <span ref={pill} aria-hidden className="pointer-events-none absolute inset-x-2 top-0 rounded-xl bg-sunken opacity-0 transition-[transform,height] duration-150 ease-[var(--ease-menu)]" />
            {items.length === 0 && !loading && (
              <p className="px-4 py-10 text-center text-[15px] text-ink-muted">
                No events match &ldquo;{q.trim()}&rdquo;. Try a club, a venue or a kind of event.
              </p>
            )}
            {items.map((it, i) => {
              const head = it.group !== lastGroup ? it.group : null;
              lastGroup = it.group;
              const Icon = it.icon;
              return (
                <div key={it.id}>
                  {head && <p className="relative px-3 pb-1.5 pt-3 text-[12.5px] font-semibold text-ink-subtle">{head}</p>}
                  <div
                    id={`cmdk-${it.id}`}
                    role="option"
                    aria-selected={i === active}
                    data-i={i}
                    onPointerMove={() => i !== active && setActive(i)}
                    onClick={() => go(it)}
                    className="relative flex min-h-12 cursor-pointer items-center gap-3 rounded-xl px-3 py-2"
                  >
                    {Icon ? (
                      <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-white text-ink-2 shadow-[0_0_0_1px_rgba(26,26,26,0.08)]">
                        <Icon className="size-[17px]" aria-hidden />
                      </span>
                    ) : (
                      <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-lavender text-[13px] font-bold text-ink" aria-hidden>
                        {it.label.slice(0, 1).toUpperCase()}
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-medium text-ink">{it.label}</span>
                      {it.meta && <span className="block truncate text-[13px] tabular-nums text-ink-muted">{it.meta}</span>}
                    </span>
                    {it.hint && <span className="shrink-0 text-[13px] font-semibold tabular-nums text-ink-2">{it.hint}</span>}
                    {i === active && <CornerDownLeft className="size-4 shrink-0 text-ink-subtle" aria-hidden />}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="hidden items-center gap-4 border-t border-line bg-sunken/60 px-5 py-3 text-[12.5px] text-ink-subtle sm:flex">
            <span>
              <span className="kbd">↑</span> <span className="kbd">↓</span> to move
            </span>
            <span>
              <span className="kbd">Enter</span> to open
            </span>
            <span className="ml-auto">
              <span className="kbd">Ctrl</span> <span className="kbd">K</span> anywhere
            </span>
          </div>
        </div>
      </div>
    </ModalDialog>
  );
}
