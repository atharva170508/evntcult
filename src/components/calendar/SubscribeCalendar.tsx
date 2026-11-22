"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarPlus, Check, Copy } from "lucide-react";
import { buttonClass } from "@/components/ui/Button";

/** Luma's "Subscribe": the events calendar as a live feed in Google, Apple or Outlook Calendar. */
export function SubscribeCalendar({ feedUrl }: { feedUrl: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const webcal = feedUrl.replace(/^https?:/, "webcal:");

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  async function copy() {
    await navigator.clipboard.writeText(feedUrl).catch(() => undefined);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const item = "flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-[14.5px] font-medium text-ink transition-colors duration-fast hover:bg-sunken";

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="true" className={buttonClass("secondary", "md", "h-10")}>
        <CalendarPlus className="size-4" aria-hidden /> Subscribe
      </button>
      {open && (
        <div className="absolute right-0 top-full z-30 mt-2 w-[280px] rounded-2xl border border-line-strong bg-white p-2 shadow-pop">
          <p className="px-3 pb-2 pt-1 text-[13px] text-ink-muted">New events appear in your calendar on their own.</p>
          <a href={`https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcal)}`} target="_blank" rel="noopener noreferrer" className={item}>
            Google Calendar
          </a>
          <a href={webcal} className={item}>
            Apple Calendar or Outlook
          </a>
          <button type="button" onClick={copy} className={item}>
            {copied ? <Check className="size-4 text-live" aria-hidden /> : <Copy className="size-4 text-ink-2" aria-hidden />}
            {copied ? "Link copied" : "Copy feed link"}
          </button>
          <p className="px-3 pb-1 pt-2 text-[12px] text-ink-subtle">This link is private to you. Don&apos;t share it.</p>
        </div>
      )}
    </div>
  );
}
