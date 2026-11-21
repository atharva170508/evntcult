"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption<T extends string> {
  value: T;
  label: string;
  /** Small secondary text on the right, like a count. */
  hint?: string;
}

/**
 * A listbox dropdown to use instead of a native <select>. The menu springs open from the trigger;
 * a highlight pill glides to whichever option the pointer or the arrow keys are on, and the
 * chosen option draws its check. Keyboard: arrows, Home/End, type to jump, Enter or Space to
 * choose, Escape to close. Pass `name` to submit it with a form.
 */
export function Select<T extends string>({
  value,
  onChange,
  options,
  label,
  name,
  className,
  size = "md",
  align = "start",
}: {
  value: T;
  onChange: (v: T) => void;
  options: SelectOption<T>[];
  /** Accessible name; also shown before the value when `size` is "md". */
  label: string;
  name?: string;
  className?: string;
  size?: "sm" | "md";
  align?: "start" | "end";
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [active, setActive] = useState(0);
  const trigger = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const pill = useRef<HTMLSpanElement>(null);
  const typed = useRef({ text: "", at: 0 });
  const current = options.find((o) => o.value === value) ?? options[0];

  const close = useCallback((focusTrigger = true) => {
    setClosing(true);
    setTimeout(() => {
      setOpen(false);
      setClosing(false);
    }, 120);
    if (focusTrigger) trigger.current?.focus();
  }, []);

  const show = (at?: number) => {
    setActive(
      at ??
        Math.max(
          0,
          options.findIndex((o) => o.value === value),
        ),
    );
    setOpen(true);
  };

  // Keep focus in the list while open, and close on outside press.
  useEffect(() => {
    if (!open) return;
    list.current?.focus({ preventScroll: true });
    const down = (e: PointerEvent) => {
      if (
        !list.current?.contains(e.target as Node) &&
        !trigger.current?.contains(e.target as Node)
      )
        close(false);
    };
    document.addEventListener("pointerdown", down);
    return () => document.removeEventListener("pointerdown", down);
  }, [open, close]);

  // Glide the pill to the active option.
  useLayoutEffect(() => {
    if (!open || !list.current || !pill.current) return;
    const el = list.current.children[active + 1] as HTMLElement | undefined; // first child is the pill
    if (!el) return;
    pill.current.style.transform = `translateY(${el.offsetTop}px)`;
    pill.current.style.height = `${el.offsetHeight}px`;
    el.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  const choose = (i: number) => {
    const o = options[i];
    if (o) onChange(o.value);
    close();
  };

  const onListKey = (e: React.KeyboardEvent) => {
    const last = options.length - 1;
    if (e.key === "ArrowDown") setActive((a) => Math.min(last, a + 1));
    else if (e.key === "ArrowUp") setActive((a) => Math.max(0, a - 1));
    else if (e.key === "Home") setActive(0);
    else if (e.key === "End") setActive(last);
    else if (e.key === "Enter" || e.key === " ") choose(active);
    else if (e.key === "Escape" || e.key === "Tab") {
      if (e.key === "Escape") e.preventDefault();
      close(e.key === "Escape");
      return;
    } else if (e.key.length === 1) {
      const now = Date.now();
      typed.current = {
        text:
          (now - typed.current.at < 600 ? typed.current.text : "") +
          e.key.toLowerCase(),
        at: now,
      };
      const hit = options.findIndex((o) =>
        o.label.toLowerCase().startsWith(typed.current.text),
      );
      if (hit >= 0) setActive(hit);
      return;
    } else return;
    e.preventDefault();
  };

  return (
    <div className={cn("relative inline-block", className)}>
      {name && <input type="hidden" name={name} value={value} />}
      <button
        ref={trigger}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? `${id}-list` : undefined}
        aria-label={`${label}: ${current?.label}`}
        onClick={() => (open ? close() : show())}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            show();
          }
        }}
        className={cn(
          "ui-field ui-select-trigger",
          size === "sm" ? "h-9 px-3 text-[13.5px]" : "h-11 px-4 text-[14.5px]",
        )}
      >
        {size === "md" && <span className="text-ink-muted">{label}</span>}
        <span className="font-semibold text-ink">{current?.label}</span>
        <ChevronDown
          className={cn(
            "ml-auto size-4 text-ink-muted transition-transform duration-[220ms] ease-[var(--ease-enter)]",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      {open && (
        <ul
          ref={list}
          id={`${id}-list`}
          role="listbox"
          tabIndex={-1}
          aria-label={label}
          aria-activedescendant={`${id}-o${active}`}
          onKeyDown={onListKey}
          data-state={closing ? "closing" : "open"}
          className={cn(
            "ui-menu absolute top-[calc(100%+6px)] z-50 min-w-full outline-none",
            align === "end"
              ? "right-0 origin-top-right"
              : "left-0 origin-top-left",
          )}
        >
          <span ref={pill} className="ui-menu-pill" aria-hidden />
          {options.map((o, i) => {
            const selected = o.value === value;
            return (
              <li
                key={o.value}
                id={`${id}-o${i}`}
                role="option"
                aria-selected={selected}
                onPointerMove={() => active !== i && setActive(i)}
                onClick={() => choose(i)}
                className="relative z-[1] flex min-h-10 cursor-pointer items-center gap-3 rounded-[10px] px-3 py-2 text-[14px] text-ink"
              >
                <span className="grid size-4 place-items-center" aria-hidden>
                  {selected && (
                    <svg viewBox="0 0 16 16" className="size-4">
                      <path
                        d="M3.5 8.5l3 3 6-7"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="ui-check"
                      />
                    </svg>
                  )}
                </span>
                <span
                  className={cn(
                    "whitespace-nowrap",
                    selected && "font-semibold",
                  )}
                >
                  {o.label}
                </span>
                {o.hint && (
                  <span className="ml-auto pl-4 text-[12.5px] tabular-nums text-ink-muted">
                    {o.hint}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
