"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Segmented filter: one choice from a short set, with a pill that slides and changes width to the
 * chosen segment. Arrow keys move between segments (roving focus), like a radio group.
 */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; count?: number }[];
  label: string;
  className?: string;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const [ind, setInd] = useState<{ x: number; w: number } | null>(null);
  const i = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );

  useLayoutEffect(() => {
    const measure = () => {
      const el =
        wrap.current?.querySelectorAll<HTMLButtonElement>("[role=radio]")[i];
      if (el) setInd({ x: el.offsetLeft, w: el.offsetWidth });
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (wrap.current) ro.observe(wrap.current);
    return () => ro.disconnect();
  }, [i, options.length]);

  const move = (to: number) => {
    const n = (to + options.length) % options.length;
    onChange(options[n].value);
    wrap.current
      ?.querySelectorAll<HTMLButtonElement>("[role=radio]")
      [n]?.focus();
  };

  return (
    <div className={cn("ui-seg-scroll", className)}>
      <div ref={wrap} role="radiogroup" aria-label={label} className="ui-seg">
        {ind && (
          <span
            className="ui-seg-pill"
            style={{ transform: `translateX(${ind.x}px)`, width: ind.w }}
            aria-hidden
          />
        )}
        {options.map((o, k) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={k === i}
            tabIndex={k === i ? 0 : -1}
            onClick={() => onChange(o.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight" || e.key === "ArrowDown")
                (e.preventDefault(), move(i + 1));
              if (e.key === "ArrowLeft" || e.key === "ArrowUp")
                (e.preventDefault(), move(i - 1));
            }}
            className="ui-seg-item"
          >
            {o.label}
            {o.count !== undefined && (
              <span className="ui-seg-count">{o.count}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
