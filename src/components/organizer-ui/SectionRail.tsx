"use client";

import { useEffect, useState } from "react";

/**
 * Jump links for the editor's sections, built from the sections on the page (so it follows
 * whatever the category adds). The section in view is marked as you scroll.
 */
export function SectionRail() {
  const [items, setItems] = useState<{ id: string; label: string }[]>([]);
  const [current, setCurrent] = useState<string | null>(null);

  useEffect(() => {
    const collect = () => {
      const secs = [...document.querySelectorAll<HTMLElement>(".o-form-col .o-section")];
      secs.forEach((el, i) => {
        if (!el.id) el.id = `osec-${(el.getAttribute("aria-label") ?? String(i)).toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
      });
      setItems(secs.map((el) => ({ id: el.id, label: el.getAttribute("aria-label") ?? "Section" })));
      return secs;
    };
    let secs = collect();
    // Sections that load their own data appear a moment later; pick them up.
    const mo = new MutationObserver(() => {
      if (document.querySelectorAll(".o-form-col .o-section").length !== secs.length) secs = collect();
      observe();
    });
    const col = document.querySelector(".o-form-col");
    if (col) mo.observe(col, { childList: true, subtree: true });
    let io: IntersectionObserver | null = null;
    const observe = () => {
      io?.disconnect();
      io = new IntersectionObserver(
        (entries) => {
          const top = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
          if (top) setCurrent(top.target.id);
        },
        { rootMargin: "-140px 0px -55% 0px" },
      );
      secs.forEach((el) => io!.observe(el));
    };
    observe();
    return () => {
      mo.disconnect();
      io?.disconnect();
    };
  }, []);

  if (items.length < 4) return null;
  return (
    <nav className="o-rail" aria-label="Sections">
      <p className="o-rail-head">Sections</p>
      {items.map((it, i) => (
        <a
          key={it.id}
          href={`#${it.id}`}
          aria-current={current === it.id}
          onClick={(e) => {
            e.preventDefault();
            document.getElementById(it.id)?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
            setCurrent(it.id);
          }}
        >
          <span>{i + 1}</span>
          {it.label}
        </a>
      ))}
    </nav>
  );
}
