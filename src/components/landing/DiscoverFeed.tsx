"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { EventArt } from "@/components/ui/EventArt";
import { Segmented } from "@/components/ui/Segmented";
import { Select } from "@/components/ui/Select";
import { formatINR } from "@/lib/money";
import { cn, fmtDate, fmtTime } from "@/lib/utils";
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
  ["tech", "Tech"],
  ["sports", "Sports"],
  ["party", "Nightlife"],
  ["learn", "Workshops"],
];

type Ev = Omit<EventSummary, "startsAt" | "endsAt"> & {
  startsAt: string | Date;
  endsAt: string | Date;
};

/** Minimal luxury discovery grid for signed-in Home. */
export function DiscoverFeed({ events }: { events: Ev[] }) {
  const [kind, setKind] = useState<Kind>("all");
  const [sort, setSort] = useState<Sort>("soon");
  const [when, setWhen] = useState<When>("any");
  const [price, setPrice] = useState<Price>("any");
  const [limit, setLimit] = useState(8);
  const [changed, setChanged] = useState(false);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setChanged(true);
  }, [kind, sort, when, price]);

  const all = useMemo(
    () => events.map((e) => ({ ...e, s: new Date(e.startsAt), en: new Date(e.endsAt) })),
    [events],
  );
  const counts = useMemo(() => {
    const c: Record<Kind, number> = { all: all.length, tech: 0, sports: 0, party: 0, learn: 0 };
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
      when === "today" ? +endOfDay : when === "week" ? now + 7 * 864e5 : when === "month" ? now + 31 * 864e5 : Infinity;
    const list = all.filter(
      (e) =>
        (kind === "all" || KIND_OF[e.category] === kind) &&
        +e.s <= horizon &&
        (price === "any" || (price === "free" ? !e.feePaise : e.feePaise > 0)),
    );
    if (sort === "popular") list.sort((a, b) => b.registered - a.registered);
    else if (sort === "price") list.sort((a, b) => a.feePaise - b.feePaise || +a.s - +b.s);
    else list.sort((a, b) => +a.s - +b.s);
    return list;
  }, [all, kind, sort, when, price]);

  if (!all.length) return null;

  return (
    <section aria-labelledby="discover-h" className="pt-14">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-4">
        <h2
          id="discover-h"
          className="font-display text-[clamp(34px,4vw,52px)] font-bold italic leading-none text-ink"
        >
          Discover.
        </h2>
        <p className="tr-meta text-ink-muted" aria-live="polite">
          {shown.length} {shown.length === 1 ? "event" : "events"}
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Segmented
          label="Category"
          value={kind}
          onChange={(k) => (setKind(k), setLimit(8))}
          options={KIND_LABEL.filter(([k]) => k === "all" || counts[k] > 0).map(([value, label]) => ({
            value,
            label,
            count: counts[value],
          }))}
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
              { value: "week", label: "7 days" },
              { value: "month", label: "30 days" },
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
              { value: "soon", label: "Soonest" },
              { value: "popular", label: "Popular" },
              { value: "price", label: "Price" },
            ]}
          />
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="mt-6 border-y border-line py-12 text-center">
          <p className="font-display text-[26px] italic text-ink">No matching events.</p>
          <button
            type="button"
            className="tr-meta tr-link mt-3 text-[#D4B87A]"
            onClick={() => (setKind("all"), setWhen("any"), setPrice("any"))}
          >
            Reset filters
          </button>
        </div>
      ) : (
        <ul
          key={`${kind}-${sort}-${when}-${price}`}
          className="mt-7 grid grid-cols-1 gap-x-5 gap-y-9 sm:grid-cols-2 lg:grid-cols-4"
        >
          {shown.slice(0, limit).map((e, i) => (
            <li key={e.id} className={cn(changed && "feed-in")} style={changed ? { animationDelay: `${Math.min(i, 8) * 35}ms` } : undefined}>
              <FeedCard e={e} />
            </li>
          ))}
        </ul>
      )}

      {shown.length > limit && (
        <div className="mt-10 flex justify-center">
          <button
            type="button"
            onClick={() => setLimit((l) => l + 8)}
            className="tr-meta inline-flex h-11 items-center rounded-[4px] border border-line-strong px-6 text-ink transition-colors hover:border-[#D4B87A] hover:text-[#D4B87A]"
          >
            Load more
          </button>
        </div>
      )}
    </section>
  );
}

function FeedCard({ e }: { e: Ev & { s: Date; en: Date } }) {
  const live = +e.s <= Date.now() && Date.now() < +e.en;

  return (
    <Link href={`/events/${e.slug}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden rounded-[4px] border border-line bg-surface">
        <div className="absolute inset-0 transition-transform duration-slow ease-out group-hover:scale-[1.03]">
          {e.bannerUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={e.bannerUrl} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />
          ) : (
            <EventArt accent={e.accent} seed={e.id} scrim={false} />
          )}
        </div>
        <span className="tr-meta absolute right-2.5 top-2.5 z-[2] rounded-[3px] bg-[#161820]/90 px-2.5 py-1 text-[#D4B87A]">
          {e.feePaise ? formatINR(e.feePaise) : "Free"}
        </span>
        {live && (
          <span className="tr-meta absolute left-2.5 top-2.5 z-[2] inline-flex items-center gap-1.5 rounded-[3px] bg-[#161820]/90 px-2.5 py-1 text-[#EFEAE0]">
            <span className="size-1.5 rounded-full bg-[#D4B87A]" aria-hidden />
            Live
          </span>
        )}
      </div>

      <div className="pt-3.5">
        <p className="tr-meta text-ink-muted">
          {fmtDate(e.s, { weekday: "short", day: "numeric", month: "short" })} · {fmtTime(e.s)}
        </p>
        <h3 className="mt-1 line-clamp-2 font-display text-[24px] font-semibold italic leading-[1.08] text-ink transition-colors group-hover:text-[#D4B87A]">
          {e.title}
        </h3>
        <p className="mt-1 truncate text-[13.5px] font-light text-ink-muted">
          {e.venueName ?? "Venue TBA"}
        </p>
      </div>
    </Link>
  );
}
