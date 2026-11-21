"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { EventArt, accentHex } from "@/components/ui/EventArt";
import { Segmented } from "@/components/ui/Segmented";
import { Select } from "@/components/ui/Select";
import { formatINR } from "@/lib/money";
import { fmtDate, fmtTime } from "@/lib/utils";
import type { EventSummary } from "@/lib/data/types";

type Kind = "all" | "tech" | "sports" | "party" | "learn";
type Sort = "soon" | "popular" | "price";
type When = "any" | "today" | "week" | "month";
type Price = "any" | "free" | "paid";

const KIND_OF: Record<string, Exclude<Kind, "all">> = {
  TECH: "tech",
  SPORTS: "sports",
  GAMING: "sports",
  PARTY: "party",
  CULTURAL: "party",
  WORKSHOP: "learn",
  TALK: "learn",
};
const KIND_LABEL: [Kind, string][] = [
  ["all", "All"],
  ["tech", "Hackathons"],
  ["sports", "Sports and gaming"],
  ["party", "Parties and culture"],
  ["learn", "Workshops and talks"],
];

/** Serialised from the server: dates arrive as strings. */
type Ev = Omit<EventSummary, "startsAt" | "endsAt"> & {
  startsAt: string | Date;
  endsAt: string | Date;
};

/**
 * The discovery feed: everything coming up, filtered by kind (sliding segmented control), time,
 * price and order (custom dropdowns). Filtering is instant and client-side; the list is already here.
 */
export function DiscoverFeed({ events }: { events: Ev[] }) {
  const [kind, setKind] = useState<Kind>("all");
  const [sort, setSort] = useState<Sort>("soon");
  const [when, setWhen] = useState<When>("any");
  const [price, setPrice] = useState<Price>("any");
  const [limit, setLimit] = useState(8);

  const all = useMemo(
    () =>
      events.map((e) => ({
        ...e,
        s: new Date(e.startsAt),
        en: new Date(e.endsAt),
      })),
    [events],
  );
  const counts = useMemo(() => {
    const c: Record<Kind, number> = {
      all: all.length,
      tech: 0,
      sports: 0,
      party: 0,
      learn: 0,
    };
    for (const e of all) {
      const k = KIND_OF[e.category];
      if (k) c[k]++;
    }
    return c;
  }, [all]);

  const shown = useMemo(() => {
    const now = Date.now();
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    const horizon =
      when === "today"
        ? +endOfDay
        : when === "week"
          ? now + 7 * 864e5
          : when === "month"
            ? now + 31 * 864e5
            : Infinity;
    const list = all.filter(
      (e) =>
        (kind === "all" || KIND_OF[e.category] === kind) &&
        +e.s <= horizon &&
        (price === "any" || (price === "free" ? !e.feePaise : e.feePaise > 0)),
    );
    if (sort === "popular") list.sort((a, b) => b.registered - a.registered);
    else if (sort === "price")
      list.sort((a, b) => a.feePaise - b.feePaise || +a.s - +b.s);
    else list.sort((a, b) => +a.s - +b.s);
    return list;
  }, [all, kind, sort, when, price]);

  if (!all.length) return null;

  return (
    <section aria-labelledby="discover-h" className="pt-14">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <h2
          id="discover-h"
          className="font-display text-[clamp(36px,4.4vw,54px)] leading-none tracking-[-0.03em] text-ink"
        >
          What&apos;s <em>on.</em>
        </h2>
        <p
          className="text-[14px] tabular-nums text-ink-muted"
          aria-live="polite"
        >
          {shown.length} {shown.length === 1 ? "event" : "events"}
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Segmented
          label="Kind of event"
          value={kind}
          onChange={(k) => (setKind(k), setLimit(8))}
          options={KIND_LABEL.filter(([k]) => k === "all" || counts[k] > 0).map(
            ([value, label]) => ({ value, label, count: counts[value] }),
          )}
        />
        <div className="flex flex-wrap gap-2">
          <Select
            size="sm"
            label="When"
            value={when}
            onChange={setWhen}
            options={[
              { value: "any", label: "Any time" },
              { value: "today", label: "Today" },
              { value: "week", label: "Next 7 days" },
              { value: "month", label: "Next 30 days" },
            ]}
          />
          <Select
            size="sm"
            label="Price"
            value={price}
            onChange={setPrice}
            options={[
              { value: "any", label: "Any price" },
              { value: "free", label: "Free" },
              { value: "paid", label: "Paid" },
            ]}
          />
          <Select
            size="sm"
            align="end"
            label="Sort"
            value={sort}
            onChange={setSort}
            options={[
              { value: "soon", label: "Soonest first" },
              { value: "popular", label: "Most people going" },
              { value: "price", label: "Lowest price" },
            ]}
          />
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="mt-6 rounded-[20px] border border-dashed border-line-strong px-6 py-12 text-center">
          <p className="text-[16px] font-semibold text-ink">
            Nothing matches those filters.
          </p>
          <button
            type="button"
            className="mt-3 text-[15px] font-semibold text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink"
            onClick={() => (setKind("all"), setWhen("any"), setPrice("any"))}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 xl:grid-cols-4">
          {shown.slice(0, limit).map((e) => (
            <li key={e.id}>
              <FeedCard e={e} />
            </li>
          ))}
        </ul>
      )}
      {shown.length > limit && (
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={() => setLimit((l) => l + 8)}
            className="ui-press ui-sheen relative inline-flex h-11 items-center rounded-full bg-white px-6 text-[14.5px] font-semibold text-ink shadow-[var(--lift-1)]"
          >
            Show {Math.min(8, shown.length - limit)} more
          </button>
        </div>
      )}
    </section>
  );
}

function FeedCard({ e }: { e: Ev & { s: Date; en: Date } }) {
  const left = e.capacity ? Math.max(0, e.capacity - e.registered) : null;
  const live = +e.s <= Date.now() && Date.now() < +e.en;
  const full = left === 0;
  const hex = accentHex(e.accent);

  return (
    <Link
      href={`/events/${e.slug}`}
      className="group block rounded-[20px] outline-offset-4"
    >
      <div className="relative">
        {/* Ambient colour bleed behind the frame on hover. */}
        <span
          aria-hidden
          className="absolute inset-x-4 bottom-0 top-8 -z-0 rounded-[24px] opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-60"
          style={{ background: hex }}
        />
        <div className="relative aspect-[4/5] overflow-hidden rounded-[20px] bg-sunken shadow-[0_0_0_1px_rgba(26,26,26,0.06)] transition-transform duration-300 ease-[var(--ease-enter)] group-hover:-translate-y-1">
          <div className="absolute inset-0 transition-transform duration-700 ease-[var(--ease-enter)] group-hover:scale-[1.03]">
            <EventArt accent={e.accent} seed={e.id} scrim={false} />
          </div>
          <span className="absolute right-3 top-3 z-[2] rounded-full bg-white/95 px-2.5 py-1 text-[13px] font-semibold tabular-nums text-ink shadow-[0_2px_8px_rgba(0,0,0,0.12)] backdrop-blur">
            {e.feePaise ? formatINR(e.feePaise) : "Free"}
          </span>
          {(live || full) && (
            <span className="absolute left-3 top-3 z-[2] inline-flex items-center gap-1.5 rounded-full bg-ink px-2.5 py-1 text-[12.5px] font-semibold text-white">
              {live && (
                <span
                  className="size-1.5 rounded-full bg-accent motion-safe:animate-pulse"
                  aria-hidden
                />
              )}
              {live ? "Live now" : "Full"}
            </span>
          )}
          {e.badges && e.badges.length > 0 && (
            <ul
              className="absolute inset-x-3 bottom-3 z-[2] flex flex-wrap gap-1.5"
              aria-label="Details"
            >
              {e.badges.map((b) => (
                <li
                  key={b}
                  className="rounded-md bg-black/55 px-2 py-0.5 text-[12px] font-semibold text-white backdrop-blur-md"
                >
                  {b}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div className="pt-3">
        <p className="text-[13px] font-semibold tabular-nums text-ink-muted">
          {fmtDate(e.s, { weekday: "short", day: "numeric", month: "short" })},{" "}
          {fmtTime(e.s)}
        </p>
        <h3 className="mt-0.5 line-clamp-2 text-[16px] font-semibold leading-snug text-ink">
          {e.title}
        </h3>
        <p className="mt-0.5 truncate text-[14px] text-ink-muted">
          {e.venueName ?? "Venue TBA"}
        </p>
        <div className="mt-2 flex items-center gap-2">
          {e.going && e.going.length > 0 && (
            <span className="flex -space-x-1" aria-hidden>
              {e.going.map((g, i) => (
                <span
                  key={i}
                  className="grid size-7 place-items-center rounded-full bg-lavender text-[10px] font-bold text-ink ring-2 ring-canvas"
                  style={{ zIndex: 3 - i }}
                >
                  {g}
                </span>
              ))}
            </span>
          )}
          <span className="text-[13px] tabular-nums text-ink-2">
            {e.registered > 0 ? `${e.registered} going` : "Be the first"}
            {left !== null && left > 0 && left <= 30 && (
              <span className="text-accent-ink">, {left} left</span>
            )}
          </span>
        </div>
      </div>
    </Link>
  );
}
