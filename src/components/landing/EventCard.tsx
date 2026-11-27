import Link from "next/link";
import { EventArt } from "@/components/ui/EventArt";
import { formatINR } from "@/lib/money";
import { cn, fmtDate, fmtTime } from "@/lib/utils";
import type { EventSummary } from "@/lib/data/types";

export function seatState(
  e: Pick<EventSummary, "capacity" | "registered" | "startsAt" | "endsAt">,
  now = new Date(),
) {
  if (+now >= +e.endsAt) return "ended" as const;
  if (+e.startsAt <= +now && +now < +e.endsAt) return "live" as const;
  if (e.capacity && e.registered >= e.capacity) return "full" as const;
  if (e.capacity && e.registered / e.capacity >= 0.8) return "filling" as const;
  return "open" as const;
}

/**
 * Editorial event sleeve card: 1px hairline border, zero drop shadows,
 * Gloock title, IBM Plex Mono date/venue/price facts.
 */
export function EventCard({ e, rows = false }: { e: EventSummary; rows?: boolean }) {
  const state = seatState(e);
  const left = e.capacity ? Math.max(0, e.capacity - e.registered) : null;
  const badge =
    state === "live"
      ? "Live"
      : state === "full"
        ? "Full"
        : state === "filling"
          ? "Almost full"
          : null;
  const day = fmtDate(e.startsAt, { day: "numeric" });
  const month = fmtDate(e.startsAt, { month: "short" });

  const facts = (
    <>
      <h3 className="truncate font-display text-[22px] leading-[1.08] tracking-[-0.015em] text-ink transition-colors group-hover:text-[#C9A26B]">
        {e.title}
      </h3>
      <p className="tr-meta mt-2 truncate text-ink-muted">
        {fmtDate(e.startsAt, { weekday: "short" })} · {fmtTime(e.startsAt)} · {e.venueName ?? "Venue TBA"}
      </p>
      <p className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-3">
        <span className="tr-meta text-[#C9A26B]">
          {e.feePaise ? formatINR(e.feePaise) : "Free"}
        </span>
        {state === "ended" ? (
          <span className="tr-meta text-ink-muted">{e.registered} went</span>
        ) : (
          left !== null &&
          state !== "full" &&
          state !== "live" &&
          left <= 50 && <span className="tr-meta text-ink-muted">{left} left</span>
        )}
      </p>
    </>
  );

  const art = (
    <>
      <EventArt
        accent={e.accent}
        seed={e.id}
        scrim={false}
        className="transition-transform duration-slow ease-out group-hover:scale-[1.03]"
      />
      <span
        className={cn(
          "absolute left-3 top-3 z-[2] inline-flex items-baseline gap-1.5 rounded-[6px] bg-[#151412]/90 px-2.5 py-1 text-[#EEE8DD]",
          rows && "max-sm:hidden",
        )}
      >
        <span className="font-display text-[17px] leading-none tabular-nums">{day}</span>
        <span className="tr-meta text-[#C9A26B]">{month}</span>
      </span>
      {badge && (
        <span
          className={cn(
            rows && "max-sm:hidden",
            "tr-meta absolute bottom-3 left-3 z-[2] inline-flex items-center gap-1.5 rounded-[6px] bg-[#151412]/90 px-2.5 py-1 text-[#EEE8DD]",
          )}
        >
          {state === "live" && <span className="size-1.5 rounded-full bg-[#C9A26B]" aria-hidden />}
          {badge}
        </span>
      )}
    </>
  );

  if (rows) {
    return (
      <Link
        href={`/events/${e.slug}`}
        className="group flex items-center gap-4 rounded-[8px] outline-offset-4 sm:block"
      >
        <div className="relative aspect-square w-[96px] shrink-0 overflow-hidden rounded-[8px] border border-line bg-sunken sm:hidden">
          {art}
        </div>
        <div className="hidden overflow-hidden rounded-[8px] border border-line bg-surface transition-colors duration-base hover:border-line-strong sm:block">
          <div className="relative aspect-[4/3] overflow-hidden bg-sunken">{art}</div>
          <div className="p-4">{facts}</div>
        </div>
        <div className="min-w-0 flex-1 sm:hidden">
          {badge && <p className="tr-meta mb-1 text-[#C9A26B]">{badge}</p>}
          {facts}
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/events/${e.slug}`}
      className="group block overflow-hidden rounded-[8px] border border-line bg-surface transition-colors duration-base hover:border-line-strong"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-sunken">{art}</div>
      <div className="p-4">{facts}</div>
    </Link>
  );
}
