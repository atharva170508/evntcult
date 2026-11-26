import Link from "next/link";
import { EventArt } from "@/components/ui/EventArt";
import { Tilt } from "@/components/motion/Tilt";
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
 * Event card, built as a physical ticket stub: artwork on top, warm paper date stub in the
 * corner, a dashed tear line with notches, then the facts. Tilts gently toward the pointer.
 */
export function EventCard({ e, rows = false }: { e: EventSummary; rows?: boolean }) {
  const state = seatState(e);
  const left = e.capacity ? Math.max(0, e.capacity - e.registered) : null;
  const badge =
    state === "live"
      ? "Live now"
      : state === "full"
        ? "Full"
        : state === "filling"
          ? "Almost full"
          : null;
  const day = fmtDate(e.startsAt, { day: "numeric" });
  const month = fmtDate(e.startsAt, { month: "short" });

  const facts = (
    <>
      <h3 className={cn("truncate font-semibold tracking-[-0.01em] text-ink", rows ? "text-[16px] sm:text-[16px]" : "text-[16px]")}>
        {e.title}
      </h3>
      <p className="mt-1 truncate text-[13.5px] text-ink-muted">
        {fmtDate(e.startsAt, { weekday: "short" })}, {fmtTime(e.startsAt)} · {e.venueName ?? "Venue TBA"}
      </p>
      <p className="mt-2.5 flex items-center justify-between gap-3 text-[14px]">
        <span className="font-semibold tabular-nums text-ink">
          {e.feePaise ? formatINR(e.feePaise) : "Free"}
        </span>
        {state === "ended" ? (
          <span className="text-ink-muted">{e.registered} went</span>
        ) : (
          left !== null &&
          state !== "full" &&
          state !== "live" &&
          left <= 50 && <span className="text-[13px] font-medium text-ink-muted">{left} left</span>
        )}
      </p>
    </>
  );

  const art = (
    <>
      <EventArt accent={e.accent} seed={e.id} scrim={false} className="transition-transform duration-[900ms] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.05]" />
      <span
        className={cn(
          "paper-keep absolute left-3 top-3 z-[2] grid min-w-[44px] place-items-center rounded-xl bg-white/95 px-2 py-1.5 text-ink shadow-[0_4px_14px_-4px_rgba(60,40,10,0.28)] ring-1 ring-ink/10",
          rows && "max-sm:hidden",
        )}
      >
        <span className="font-display text-[21px] leading-none tabular-nums text-ink">{day}</span>
        <span className="mt-0.5 text-[10.5px] font-semibold uppercase tracking-[0.04em] text-accent">{month}</span>
      </span>
      {badge && (
        <span
          className={cn(
            rows && "max-sm:hidden",
            "paper-keep absolute bottom-3 left-3 z-[2] inline-flex items-center gap-1.5 rounded-lg bg-white/95 px-2.5 py-1 text-[12px] font-semibold text-ink shadow-[0_4px_12px_-4px_rgba(60,40,10,0.25)]",
          )}
        >
          {state === "live" && <span className="size-1.5 rounded-full bg-accent motion-safe:animate-pulse" aria-hidden />}
          {badge}
        </span>
      )}
    </>
  );

  if (rows) {
    return (
      <Link
        href={`/events/${e.slug}`}
        className="group flex items-center gap-4 rounded-card outline-offset-4 sm:block"
      >
        <div className="relative aspect-square w-[104px] shrink-0 overflow-hidden rounded-card bg-sunken sm:hidden">{art}</div>
        <div className="hidden overflow-hidden rounded-card border border-line-strong bg-surface/90 shadow-card backdrop-blur-md transition-[transform,box-shadow,border-color] duration-slow ease-out hover:-translate-y-1 hover:shadow-raised dark:border-white/12 dark:bg-[#1A1816]/80 dark:hover:border-white/24 sm:block">
          <div className="relative aspect-[4/3] overflow-hidden bg-sunken">{art}</div>
          <div className="stub-tear" aria-hidden />
          <div className="p-4 pt-3.5">{facts}</div>
        </div>
        <div className="min-w-0 flex-1 sm:hidden">
          {badge && <p className="mb-0.5 text-[12.5px] font-semibold text-accent sm:hidden">{badge}</p>}
          {facts}
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/events/${e.slug}`} className="group block rounded-card outline-offset-4">
      <Tilt max={5} className="overflow-hidden rounded-card border border-line-strong bg-surface/90 shadow-card backdrop-blur-md transition-[box-shadow,border-color] duration-slow ease-out group-hover:shadow-raised dark:border-white/12 dark:bg-[#1A1816]/80 dark:group-hover:border-white/24">
        <div className="relative aspect-[4/3] overflow-hidden bg-sunken">{art}</div>
        <div className="stub-tear" aria-hidden />
        <div className="p-4 pt-3.5">{facts}</div>
      </Tilt>
    </Link>
  );
}
