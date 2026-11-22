"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const DOW = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const parse = (v: string) => {
  const [y, m, d] = v.split("-").map(Number);
  return y && m && d ? new Date(y, m - 1, d) : null;
};
const sameDay = (a: Date | null, b: Date | null) => !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** Close on outside press and Escape; flip above the trigger when there's no room below. */
export function usePopover(open: boolean, close: () => void, refs: React.RefObject<HTMLElement | null>[]) {
  const [up, setUp] = useState(false);
  useEffect(() => {
    if (!open) return;
    const down = (e: PointerEvent) => {
      if (!refs.some((r) => r.current?.contains(e.target as Node))) close();
    };
    const key = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("pointerdown", down);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("pointerdown", down);
      document.removeEventListener("keydown", key);
    };
  }, [open, close, refs]);
  useLayoutEffect(() => {
    if (!open || !refs[0].current) return;
    const r = refs[0].current.getBoundingClientRect();
    setUp(window.innerHeight - r.bottom < 360 && r.top > 360);
  }, [open, refs]);
  return up;
}

/**
 * A date field with a calendar that opens under it, like Luma's: month arrows, Today, the
 * chosen day filled in ink, today ringed, days before `min` dimmed. Keyboard: arrows move a day
 * or a week, Page Up/Down a month, Home/End the week, Enter picks, Escape closes.
 */
export function DatePicker({
  value,
  onChange,
  label,
  min,
  className,
  placeholder = "Pick a date",
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  min?: string;
  className?: string;
  placeholder?: string;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const chosen = parse(value);
  const minD = min ? parse(min) : null;
  const [view, setView] = useState(() => chosen ?? new Date());
  const [focus, setFocus] = useState<Date>(() => chosen ?? new Date());
  const trigger = useRef<HTMLButtonElement>(null);
  const pop = useRef<HTMLDivElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  const up = usePopover(open, close, [trigger, pop]);

  useEffect(() => {
    if (!open) return;
    const start = chosen ?? new Date();
    setView(start);
    setFocus(start);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  useEffect(() => {
    if (open) grid.current?.querySelector<HTMLButtonElement>('[data-focus="true"]')?.focus({ preventScroll: true });
  }, [open, focus]);

  const first = new Date(view.getFullYear(), view.getMonth(), 1);
  const lead = (first.getDay() + 6) % 7;
  const days = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => new Date(view.getFullYear(), view.getMonth(), i + 1))];
  const today = new Date();
  const disabled = (d: Date) => !!minD && d < new Date(minD.getFullYear(), minD.getMonth(), minD.getDate());

  const move = (d: Date) => {
    setFocus(d);
    if (d.getMonth() !== view.getMonth() || d.getFullYear() !== view.getFullYear()) setView(d);
  };
  const pick = (d: Date) => {
    if (disabled(d)) return;
    onChange(iso(d));
    setOpen(false);
    trigger.current?.focus();
  };
  const onKey = (e: React.KeyboardEvent) => {
    const f = new Date(focus);
    const step: Record<string, () => void> = {
      ArrowLeft: () => f.setDate(f.getDate() - 1),
      ArrowRight: () => f.setDate(f.getDate() + 1),
      ArrowUp: () => f.setDate(f.getDate() - 7),
      ArrowDown: () => f.setDate(f.getDate() + 7),
      PageUp: () => f.setMonth(f.getMonth() - 1),
      PageDown: () => f.setMonth(f.getMonth() + 1),
      Home: () => f.setDate(f.getDate() - ((f.getDay() + 6) % 7)),
      End: () => f.setDate(f.getDate() + (6 - ((f.getDay() + 6) % 7))),
    };
    if (step[e.key]) {
      e.preventDefault();
      step[e.key]();
      move(f);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      pick(focus);
    }
  };

  return (
    <div className={cn("relative", className)}>
      <button
        ref={trigger}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`${label}: ${chosen ? chosen.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "not set"}`}
        onClick={() => setOpen((o) => !o)}
        className="ui-field ui-select-trigger h-11 px-3.5 text-[14.5px]"
      >
        <CalendarDays className="size-4 shrink-0 text-ink-muted" aria-hidden />
        <span className={cn("truncate tabular-nums", chosen ? "font-semibold text-ink" : "text-ink-subtle")}>
          {chosen ? chosen.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" }) : placeholder}
        </span>
      </button>
      {open && (
        <div
          ref={pop}
          role="dialog"
          aria-label={label}
          className={cn("ui-menu absolute left-0 z-50 max-h-none w-[300px] p-3", up ? "bottom-[calc(100%+6px)] origin-bottom-left" : "top-[calc(100%+6px)] origin-top-left")}
        >
          <div className="flex items-center justify-between px-1 pb-2">
            <p className="text-[15px] font-semibold text-ink" aria-live="polite" id={`${id}-m`}>
              {view.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
            </p>
            <div className="flex gap-1">
              <button type="button" aria-label="Previous month" onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))} className="grid size-8 place-items-center rounded-lg text-ink-2 hover:bg-sunken">
                <ChevronLeft className="size-4" aria-hidden />
              </button>
              <button type="button" aria-label="Next month" onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))} className="grid size-8 place-items-center rounded-lg text-ink-2 hover:bg-sunken">
                <ChevronRight className="size-4" aria-hidden />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-7 pb-1 text-center text-[11.5px] font-semibold text-ink-subtle" aria-hidden>
            {DOW.map((d) => (
              <span key={d} className="py-1">
                {d}
              </span>
            ))}
          </div>
          <div ref={grid} role="grid" aria-labelledby={`${id}-m`} onKeyDown={onKey} className="grid grid-cols-7 gap-0.5">
            {cells.map((d, i) =>
              d ? (
                <button
                  key={i}
                  type="button"
                  role="gridcell"
                  tabIndex={sameDay(d, focus) ? 0 : -1}
                  data-focus={sameDay(d, focus)}
                  aria-selected={sameDay(d, chosen)}
                  aria-current={sameDay(d, today) ? "date" : undefined}
                  disabled={disabled(d)}
                  onClick={() => pick(d)}
                  className={cn(
                    "relative grid h-9 place-items-center rounded-[10px] text-[13.5px] tabular-nums transition-colors duration-100",
                    sameDay(d, chosen) ? "bg-ink font-semibold text-white" : "text-ink hover:bg-sunken",
                    sameDay(d, today) && !sameDay(d, chosen) && "font-semibold ring-1 ring-inset ring-line-strong",
                    disabled(d) && "pointer-events-none opacity-30",
                  )}
                >
                  {d.getDate()}
                </button>
              ) : (
                <span key={i} />
              ),
            )}
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-line pt-2">
            <button type="button" onClick={() => pick(new Date())} className="rounded-lg px-2.5 py-1.5 text-[13px] font-semibold text-ink hover:bg-sunken" disabled={disabled(new Date())}>
              Today
            </button>
            <button
              type="button"
              onClick={() => {
                const t = new Date();
                t.setDate(t.getDate() + ((6 - t.getDay() + 7) % 7 || 7));
                pick(t);
              }}
              className="rounded-lg px-2.5 py-1.5 text-[13px] font-semibold text-ink-2 hover:bg-sunken"
            >
              This Saturday
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const SLOTS = Array.from({ length: 96 }, (_, i) => `${String(Math.floor(i / 4)).padStart(2, "0")}:${String((i % 4) * 15).padStart(2, "0")}`);
export const timeLabel = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  if (Number.isNaN(h)) return "";
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "am" : "pm"}`;
};
/** "7", "730", "7:30pm", "19:30" -> "19:30". */
function parseTyped(t: string): string | null {
  const s = t.trim().toLowerCase().replace(/\s+/g, "");
  const m = /^(\d{1,2})(?::?(\d{2}))?(am|pm|a|p)?$/.exec(s);
  if (!m) return null;
  let h = Number(m[1]);
  const min = Number(m[2] ?? 0);
  if (m[3]?.startsWith("p") && h < 12) h += 12;
  if (m[3]?.startsWith("a") && h === 12) h = 0;
  if (!m[3] && h >= 1 && h <= 7) h += 12; // campus events: "7" means evening
  return h < 24 && min < 60 ? `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}` : null;
}

/**
 * A time field: a list of 15-minute slots that opens scrolled to the current time, plus typing
 * ("7:30", "730p", "19:30" all work; a bare 1 to 7 means evening, since that's when campus
 * events happen). Arrows move, Enter picks, Escape closes.
 */
export function TimePicker({ value, onChange, label, className }: { value: string; onChange: (v: string) => void; label: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [active, setActive] = useState(() => Math.max(0, SLOTS.indexOf(value)));
  const trigger = useRef<HTMLButtonElement>(null);
  const pop = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const close = useCallback(() => setOpen(false), []);
  const up = usePopover(open, close, [trigger, pop]);

  useEffect(() => {
    if (!open) return;
    const near = value ? SLOTS.findIndex((s) => s >= value) : SLOTS.indexOf("18:00");
    setActive(near < 0 ? 0 : near);
    setTyped("");
    setTimeout(() => pop.current?.querySelector("input")?.focus(), 0);
  }, [open, value]);
  useLayoutEffect(() => {
    list.current?.children[active]?.scrollIntoView({ block: "center" });
  }, [active, open]);

  const pick = (v: string) => {
    onChange(v);
    setOpen(false);
    trigger.current?.focus();
  };
  const exact = parseTyped(typed);
  const shown = typed ? SLOTS.filter((s) => timeLabel(s).replace(/\s/g, "").startsWith(typed.replace(/\s/g, "").toLowerCase()) || s.startsWith(typed)) : SLOTS;

  return (
    <div className={cn("relative", className)}>
      <button
        ref={trigger}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${label}: ${value ? timeLabel(value) : "not set"}`}
        onClick={() => setOpen((o) => !o)}
        className="ui-field ui-select-trigger h-11 px-3.5 text-[14.5px]"
      >
        <span className={cn("tabular-nums", value ? "font-semibold text-ink" : "text-ink-subtle")}>{value ? timeLabel(value) : "Time"}</span>
      </button>
      {open && (
        <div ref={pop} className={cn("ui-menu absolute left-0 z-50 w-[200px] p-2", up ? "bottom-[calc(100%+6px)] origin-bottom-left" : "top-[calc(100%+6px)] origin-top-left")}>
          <input
            aria-label={`Type a time for ${label}`}
            value={typed}
            placeholder="Type, like 7:30"
            onChange={(e) => {
              setTyped(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              const n = (typed ? shown : SLOTS).length;
              if (e.key === "ArrowDown") (e.preventDefault(), setActive((a) => Math.min(n - 1, a + 1)));
              else if (e.key === "ArrowUp") (e.preventDefault(), setActive((a) => Math.max(0, a - 1)));
              else if (e.key === "Enter") {
                e.preventDefault();
                if (exact) pick(exact);
                else if ((typed ? shown : SLOTS)[active]) pick((typed ? shown : SLOTS)[active]);
              }
            }}
            className="mb-1.5 h-9 w-full rounded-[10px] bg-sunken px-3 text-[13.5px] text-ink outline-none placeholder:text-ink-subtle focus-visible:shadow-[var(--focus-field)]"
          />
          {exact && !SLOTS.includes(exact) && (
            <button type="button" onClick={() => pick(exact)} className="mb-1 w-full rounded-[10px] px-3 py-2 text-left text-[13.5px] font-semibold text-ink hover:bg-sunken">
              Use {timeLabel(exact)}
            </button>
          )}
          <ul ref={list} role="listbox" aria-label={label} className="max-h-[232px] overflow-y-auto overscroll-contain">
            {(typed ? shown : SLOTS).map((s, i) => (
              <li
                key={s}
                role="option"
                aria-selected={s === value}
                onPointerMove={() => setActive(i)}
                onClick={() => pick(s)}
                className={cn(
                  "flex h-9 cursor-pointer items-center justify-between rounded-[10px] px-3 text-[13.5px] tabular-nums",
                  i === active && "bg-sunken",
                  s === value ? "font-semibold text-ink" : "text-ink-2",
                )}
              >
                {timeLabel(s)}
                {s === value && <span className="size-1.5 rounded-full bg-ink" aria-hidden />}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
