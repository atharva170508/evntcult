"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, m } from "motion/react";
import { ArrowUpRight, CalendarDays, ChevronDown, ChevronUp, Link2, MapPin, Ticket, X } from "lucide-react";
import type { EventSummary } from "@/lib/data/types";
import { EventArt } from "@/components/ui/EventArt";
import { seatState } from "@/components/landing/EventCard";
import { formatINR } from "@/lib/money";
import { fmtDate, fmtTime } from "@/lib/utils";
import { toast } from "@/components/ui/Toaster";

type Detail = { description: string | null; mine: string | null };

/**
 * Luma's quick view: on a wide screen, clicking an event opens it in a panel on the right
 * instead of leaving the list. ↑ ↓ (or J K) step through events, Esc closes, and "Event page"
 * goes all the way. Ctrl/Cmd-click and phones keep normal links.
 */
export function EventPeek({ events, children }: { events: EventSummary[]; children: React.ReactNode }) {
  const [slug, setSlug] = useState<string | null>(null);
  const [detail, setDetail] = useState<Record<string, Detail>>({});
  const wrap = useRef<HTMLDivElement>(null);
  const idx = events.findIndex((e) => e.slug === slug);
  const e = idx >= 0 ? events[idx] : null;

  const open = useCallback(
    (s: string | null) => {
      setSlug(s);
      wrap.current?.querySelectorAll<HTMLElement>("[data-peek]").forEach((el) => {
        el.toggleAttribute("data-active", el.dataset.peek === s);
        if (el.dataset.peek === s) el.scrollIntoView({ block: "nearest", behavior: "smooth" });
      });
    },
    [],
  );

  useEffect(() => {
    if (!slug || detail[slug]) return;
    void fetch(`/api/events/${slug}`)
      .then((r) => (r.ok ? (r.json() as Promise<{ event?: { description?: string | null }; my_registration?: { status: string } | null }>) : null))
      .then((d) =>
        setDetail((x) => ({ ...x, [slug]: { description: d?.event?.description ?? null, mine: d?.my_registration?.status ?? null } })),
      )
      .catch(() => undefined);
  }, [slug, detail]);

  useEffect(() => {
    if (!slug) return;
    const key = (ev: KeyboardEvent) => {
      const t = ev.target as HTMLElement;
      if (t.closest("input, textarea, [contenteditable]")) return;
      if (ev.key === "Escape") open(null);
      else if (ev.key === "ArrowDown" || ev.key === "j") {
        ev.preventDefault();
        open(events[Math.min(events.length - 1, idx + 1)].slug);
      } else if (ev.key === "ArrowUp" || ev.key === "k") {
        ev.preventDefault();
        open(events[Math.max(0, idx - 1)].slug);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [slug, idx, events, open]);

  const onClickCapture = (ev: React.MouseEvent) => {
    if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.button !== 0) return;
    if (!window.matchMedia("(min-width: 1024px)").matches) return;
    const row = (ev.target as HTMLElement).closest<HTMLElement>("[data-peek]");
    if (!row || (ev.target as HTMLElement).closest("button")) return;
    ev.preventDefault();
    open(row.dataset.peek === slug ? null : row.dataset.peek!);
  };

  const d = slug ? detail[slug] : undefined;
  const state = e ? seatState(e) : null;
  const left = e?.capacity ? Math.max(0, e.capacity - e.registered) : null;

  return (
    <div ref={wrap} onClickCapture={onClickCapture} className={slug ? "lg:pr-[452px] lg:transition-[padding] lg:duration-300" : "lg:transition-[padding] lg:duration-300"}>
      {children}
      <AnimatePresence>
        {e && (
          <m.aside
            key="peek"
            aria-label={`Quick view: ${e.title}`}
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 40, opacity: 0, transition: { duration: 0.16 } }}
            transition={{ type: "spring", stiffness: 420, damping: 38 }}
            className="fixed bottom-4 right-4 top-[calc(var(--header-h)+12px)] z-40 hidden w-[430px] flex-col overflow-hidden rounded-[22px] border border-line bg-white shadow-[0_24px_60px_-20px_rgba(30,20,5,.35)] lg:flex"
          >
            <div className="flex items-center gap-1 border-b border-line px-3 py-2">
              <button type="button" onClick={() => open(null)} aria-label="Close quick view" className="grid size-8 place-items-center rounded-lg text-ink-2 hover:bg-sunken">
                <X className="size-4" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard.writeText(`${location.origin}/e/${e.slug}`);
                  toast("Link copied");
                }}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-semibold text-ink-2 hover:bg-sunken"
              >
                <Link2 className="size-3.5" aria-hidden /> Copy link
              </button>
              <Link href={`/events/${e.slug}`} className="inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-[13px] font-semibold text-ink-2 hover:bg-sunken">
                Event page <ArrowUpRight className="size-3.5" aria-hidden />
              </Link>
              <span className="ml-auto flex items-center gap-0.5">
                <span className="mr-1 text-[12px] tabular-nums text-ink-subtle">
                  {idx + 1}/{events.length}
                </span>
                <button type="button" aria-label="Previous event" aria-keyshortcuts="k ArrowUp" disabled={idx === 0} onClick={() => open(events[idx - 1].slug)} className="grid size-8 place-items-center rounded-lg text-ink-2 hover:bg-sunken disabled:opacity-30">
                  <ChevronUp className="size-4" aria-hidden />
                </button>
                <button type="button" aria-label="Next event" aria-keyshortcuts="j ArrowDown" disabled={idx === events.length - 1} onClick={() => open(events[idx + 1].slug)} className="grid size-8 place-items-center rounded-lg text-ink-2 hover:bg-sunken disabled:opacity-30">
                  <ChevronDown className="size-4" aria-hidden />
                </button>
              </span>
            </div>
            <AnimatePresence mode="wait" initial={false}>
              <m.div key={e.slug} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6, transition: { duration: 0.1 } }} transition={{ duration: 0.18 }} className="flex-1 overflow-y-auto p-5">
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-sunken">
                  {e.bannerUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={e.bannerUrl} alt="" className="size-full object-cover" />
                  ) : (
                    <EventArt accent={e.accent} seed={e.id} scrim={false} />
                  )}
                  {state === "live" && (
                    <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1 text-[12px] font-semibold text-ink shadow">
                      <span className="size-1.5 animate-pulse rounded-full bg-brand" /> Live now
                    </span>
                  )}
                </div>
                <h2 className="mt-4 font-display text-[28px] leading-[1.1] text-ink">{e.title}</h2>
                {e.tagline && <p className="mt-1.5 text-[14.5px] text-ink-muted">{e.tagline}</p>}
                <dl className="mt-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <dt className="grid w-6 shrink-0 place-items-center text-ink-2">
                      <CalendarDays className="size-4" aria-label="When" />
                    </dt>
                    <dd>
                      <p className="text-[14.5px] font-semibold text-ink">{fmtDate(e.startsAt, { weekday: "long", day: "numeric", month: "long" })}</p>
                      <p className="text-[13px] tabular-nums text-ink-muted">
                        {fmtTime(e.startsAt)} to{" "}
                        {new Date(e.endsAt).toDateString() !== new Date(e.startsAt).toDateString() ? `${fmtDate(e.endsAt, { day: "numeric", month: "short" })}, ` : ""}
                        {fmtTime(e.endsAt)}
                      </p>
                    </dd>
                  </div>
                  {e.venueName && (
                    <div className="flex items-center gap-3">
                      <dt className="grid w-6 shrink-0 place-items-center text-ink-2">
                        <MapPin className="size-4" aria-label="Where" />
                      </dt>
                      <dd className="text-[14.5px] font-semibold text-ink">{e.venueName}</dd>
                    </div>
                  )}
                </dl>
                <div className="mt-5 rounded-2xl border border-line bg-canvas/60 p-4">
                  {d?.mine === "registered" ? (
                    <p className="flex items-center gap-2 text-[14.5px] font-semibold text-ink">
                      <Ticket className="size-4" aria-hidden /> You&apos;re going
                    </p>
                  ) : (
                    <>
                      <p className="text-[13px] text-ink-muted">
                        {state === "full" ? "Sold out. You can join the waitlist." : left !== null ? `${left.toLocaleString("en-IN")} seats left` : "Open to everyone"}
                      </p>
                      <p className="mt-0.5 text-[20px] font-semibold tabular-nums text-ink">{e.feePaise > 0 ? formatINR(e.feePaise) : "Free"}</p>
                    </>
                  )}
                  <Link href={`/events/${e.slug}${d?.mine === "registered" ? "" : "#register"}`} className="mt-3 flex h-11 items-center justify-center rounded-xl whitespace-nowrap bg-lavender text-[15px] font-semibold text-ink ring-2 ring-inset ring-ink">
                    {d?.mine === "registered" ? "Open event" : state === "full" ? "Join waitlist" : "Register"}
                  </Link>
                </div>
                {e.registered > 0 && (
                  <p className="mt-4 text-[13.5px] text-ink-muted">
                    <span className="font-semibold tabular-nums text-ink">{e.registered.toLocaleString("en-IN")}</span> going
                  </p>
                )}
                <div className="mt-5 border-t border-line pt-4">
                  <h3 className="text-[13px] font-semibold text-ink-muted">About</h3>
                  {d === undefined ? (
                    <div className="mt-2 space-y-2" aria-hidden>
                      <div className="h-3 w-full animate-pulse rounded bg-sunken" />
                      <div className="h-3 w-4/5 animate-pulse rounded bg-sunken" />
                    </div>
                  ) : (
                    <p className="mt-1.5 line-clamp-[8] whitespace-pre-line text-[14.5px] leading-relaxed text-ink-2">{d.description || "The host hasn't written a description yet."}</p>
                  )}
                </div>
                <p className="mt-6 text-center text-[11.5px] text-ink-subtle">
                  <kbd className="rounded border border-line px-1">↑</kbd> <kbd className="rounded border border-line px-1">↓</kbd> to move, <kbd className="rounded border border-line px-1">Esc</kbd> to close
                </p>
              </m.div>
            </AnimatePresence>
          </m.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
