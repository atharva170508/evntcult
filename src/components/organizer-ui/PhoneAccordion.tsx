"use client";

import { useEffect } from "react";

/**
 * Phones: the editor's sections fold to their headings and one opens at a time, so the form is
 * a short list instead of six screens of fields. Laptops are untouched. Works on sections that
 * mount later too (poster, questions, merch).
 */
export function PhoneAccordion() {
  useEffect(() => {
    const col = document.querySelector<HTMLElement>(".o-form-col");
    if (!col) return;
    const mq = window.matchMedia("(max-width: 767px)");

    const sections = () => [...col.querySelectorAll<HTMLElement>(".o-section")];
    const open = (target: HTMLElement | null) => {
      for (const s of sections()) {
        const on = s === target;
        s.classList.toggle("is-open", on);
        s.querySelector(".o-section-head")?.setAttribute("aria-expanded", String(on));
      }
    };
    const wire = () => {
      for (const s of sections()) {
        const head = s.querySelector<HTMLElement>(".o-section-head");
        if (!head || head.dataset.acc) continue;
        head.dataset.acc = "1";
        head.setAttribute("role", "button");
        head.tabIndex = 0;
        head.setAttribute("aria-expanded", String(s.classList.contains("is-open")));
      }
      if (!col.querySelector(".o-section.is-open")) open(sections()[0] ?? null);
    };

    const onClick = (e: Event) => {
      if (!mq.matches) return;
      const head = (e.target as HTMLElement).closest<HTMLElement>(".o-section-head");
      if (!head) return;
      const sec = head.closest<HTMLElement>(".o-section");
      if (!sec) return;
      const wasOpen = sec.classList.contains("is-open");
      open(wasOpen ? null : sec);
      if (!wasOpen) requestAnimationFrame(() => sec.scrollIntoView({ block: "start", behavior: "smooth" }));
    };
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "Enter" || e.key === " ") && (e.target as HTMLElement).classList?.contains("o-section-head")) {
        e.preventDefault();
        onClick(e);
      }
    };
    // The publish checklist's "Add" asks for a section by its wrapper id.
    const onOpen = (e: Event) => {
      const id = (e as CustomEvent<string>).detail;
      const wrap = document.getElementById(id);
      open(wrap?.matches(".o-section") ? wrap : (wrap?.querySelector<HTMLElement>(".o-section") ?? null));
    };

    wire();
    col.classList.add("o-acc");
    const mo = new MutationObserver(wire);
    mo.observe(col, { childList: true, subtree: true });
    col.addEventListener("click", onClick);
    col.addEventListener("keydown", onKey);
    window.addEventListener("o-open", onOpen);
    return () => {
      mo.disconnect();
      col.classList.remove("o-acc");
      col.removeEventListener("click", onClick);
      col.removeEventListener("keydown", onKey);
      window.removeEventListener("o-open", onOpen);
    };
  }, []);
  return null;
}
