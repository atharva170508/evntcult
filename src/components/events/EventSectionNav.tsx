"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

/**
 * A sticky jump bar for long event pages: About, Agenda, Lineup, Updates... The dark pill slides
 * to the section you're reading as you scroll; tapping a tab scrolls there. Only shown when the
 * page has three or more sections, so short pages stay quiet.
 */
export function EventSectionNav({ sections }: { sections: { id: string; label: string }[] }) {
  const [active, setActive] = useState(sections[0]?.id);
  const wrap = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState<{ x: number; w: number } | null>(null);

  useEffect(() => {
    const els = sections.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (vis) setActive(vis.target.id);
      },
      { rootMargin: "-170px 0px -55% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [sections]);

  useLayoutEffect(() => {
    const el = wrap.current?.querySelector<HTMLElement>(`[data-id="${active}"]`);
    if (!el) return;
    setPill({ x: el.offsetLeft, w: el.offsetWidth });
    el.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [active]);

  if (sections.length < 3) return null;
  return (
    <nav aria-label="On this page" className="sticky top-[calc(var(--header-h)+8px)] z-20 -mx-1 mt-8 px-1 py-2">
      <div className="ui-seg-scroll w-fit max-w-full rounded-[16px] bg-canvas/85 shadow-[0_10px_28px_-14px_rgba(60,40,10,0.4)] backdrop-blur-xl">
        <div ref={wrap} className="ui-seg">
          {pill && <span className="ui-seg-pill" style={{ transform: `translateX(${pill.x}px)`, width: pill.w }} aria-hidden />}
          {sections.map((s) => (
            <a
              key={s.id}
              data-id={s.id}
              href={`#${s.id}`}
              aria-current={active === s.id ? "true" : undefined}
              onClick={(e) => {
                e.preventDefault();
                setActive(s.id);
                const el = document.getElementById(s.id);
                if (!el) return;
                const y = el.getBoundingClientRect().top + window.scrollY - 168;
                window.scrollTo({ top: y, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
              }}
              className="ui-seg-item"
              style={{ color: active === s.id ? "#fff" : undefined }}
            >
              {s.label}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}
