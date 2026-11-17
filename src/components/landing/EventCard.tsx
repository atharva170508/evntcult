import Link from "next/link";
import { EventArt } from "@/components/ui/EventArt";
import { formatINR } from "@/lib/money";
import { fmtDate, fmtTime } from "@/lib/utils";
import type { EventSummary } from "@/lib/data/types";
import { categoryName } from "@/components/site/categories";

export function seatState(e: Pick<EventSummary, "capacity" | "registered" | "startsAt" | "endsAt">, now = new Date()) {
  if (+e.startsAt <= +now && +now < +e.endsAt) return "live" as const;
  if (e.capacity && e.registered >= e.capacity) return "full" as const;
  if (e.capacity && e.registered / e.capacity >= 0.8) return "filling" as const;
  return "open" as const;
}

/**
 * Event card: the poster carries the mood, the text underneath carries the facts.
 * No box around it — the artwork is the edge.
 */
export function EventCard({ e, priority = false }: { e: EventSummary; priority?: boolean }) {
  const state = seatState(e);
  const left = e.capacity ? Math.max(0, e.capacity - e.registered) : null;

  return (
    <Link href={`/events/${e.slug}`} className="group block rounded-[20px] outline-offset-4" prefetch={priority}>
      <div className="relative aspect-[5/4] overflow-hidden rounded-[18px] bg-sunken">
        <EventArt accent={e.accent} seed={e.id} scrim={false} className="transition-transform duration-[900ms] ease-out group-hover:scale-[1.035]" />
        <div className="absolute left-3 top-3 flex min-w-[52px] flex-col items-center rounded-xl bg-white px-2.5 py-1.5 text-center shadow-[0_2px_8px_rgba(11,22,38,0.18)]">
          <span className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-accent">{fmtDate(e.startsAt, { month: "short" })}</span>
          <span className="font-display text-[22px] font-semibold leading-none tracking-[-0.02em] text-ink">{fmtDate(e.startsAt, { day: "numeric" })}</span>
        </div>
        {state !== "open" && (
          <span
            className={
              state === "live"
                ? "absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-lg bg-white px-2 py-1 text-[12px] font-semibold text-live"
                : state === "full"
                  ? "absolute right-3 top-3 rounded-lg bg-night/85 px-2 py-1 text-[12px] font-semibold text-white"
                  : "absolute right-3 top-3 rounded-lg bg-white px-2 py-1 text-[12px] font-semibold text-warn"
            }
          >
            {state === "live" && <span className="size-1.5 rounded-full bg-live-dot motion-safe:animate-pulse-dot" aria-hidden />}
            {state === "live" ? "Happening now" : state === "full" ? "Full" : "Filling fast"}
          </span>
        )}
      </div>
      <div className="px-0.5 pt-3.5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-2 text-[16.5px] font-semibold leading-snug tracking-[-0.01em] text-ink decoration-[1.5px] underline-offset-4 group-hover:underline">{e.title}</h3>
          <span className="shrink-0 pt-0.5 text-[15px] font-semibold text-ink">{e.feePaise ? formatINR(e.feePaise) : "Free"}</span>
        </div>
        <p className="mt-1 text-[14px] text-ink-muted">
          {fmtDate(e.startsAt, { weekday: "short" })}, {fmtTime(e.startsAt)}
          {e.venueName ? ` · ${e.venueName}` : ""}
        </p>
        <p className="mt-0.5 text-[13.5px] text-ink-subtle">
          {categoryName(e.category)}
          {left !== null && state !== "full" ? ` · ${left} ${left === 1 ? "seat" : "seats"} left` : ""}
        </p>
      </div>
    </Link>
  );
}
