import Link from "next/link";
import { EventArt } from "@/components/ui/EventArt";
import { Spotlight } from "@/components/motion/Spotlight";
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

/** Event card: artwork, one badge at most, then the facts. */
/** `rows`: on phones the card lies flat as a list row (art left, details right); from sm up it's the poster card. */
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

  return (
    <Link
      href={`/events/${e.slug}`}
      className={cn("group rounded-[20px] outline-offset-4", rows ? "flex items-center gap-4 sm:block" : "block")}
    >
      <Spotlight
        tone="light"
        className={cn(rows && "w-[104px] shrink-0 rounded-[16px] sm:w-auto sm:rounded-[20px]", "aspect-[20/19] overflow-hidden rounded-[20px] bg-sunken shadow-[0_0_0_1px_rgba(60,40,10,0.04)] transition-[transform,box-shadow] duration-slow ease-out group-hover:-translate-y-0.5 group-hover:shadow-[0_18px_36px_-16px_rgba(60,40,10,0.35)]")}
      >
        <EventArt
          accent={e.accent}
          seed={e.id}
          scrim={false}
          className="transition-transform duration-500 ease-out"
        />
        {badge && (
          <span className={cn(rows && "max-sm:hidden", "absolute left-3 top-3 z-[2] inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1 text-[12.5px] font-semibold text-ink shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_2px_6px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.1)]")}>
            {state === "live" && (
              <span
                className="size-1.5 rounded-full bg-accent motion-safe:animate-pulse"
                aria-hidden
              />
            )}
            {badge}
          </span>
        )}
      </Spotlight>
      <div className={cn(rows ? "min-w-0 flex-1 sm:pt-3" : "pt-3")}>
        {rows && badge && <p className="mb-0.5 text-[12.5px] font-semibold text-accent sm:hidden">{badge}</p>}
        <h3 className={cn("truncate font-semibold text-ink", rows ? "text-[16px] sm:text-[15px]" : "text-[15px]")}>
          {e.title}
        </h3>
        <p className="mt-0.5 truncate text-[14px] text-ink-muted">
          {fmtDate(e.startsAt, {
            weekday: "short",
            day: "numeric",
            month: "short",
          })}
          , {fmtTime(e.startsAt)}
        </p>
        <p className="truncate text-[14px] text-ink-muted">
          {e.venueName ?? "Venue TBA"}
        </p>
        <p className="mt-1 text-[14px] text-ink">
          <span className="font-semibold tabular-nums">
            {e.feePaise ? formatINR(e.feePaise) : "Free"}
          </span>
          {state === "ended" ? (
            <span className="text-ink-muted">, {e.registered} went</span>
          ) : (
            left !== null &&
            state !== "full" &&
            state !== "live" &&
            left <= 50 && <span className="text-ink-muted">, {left} left</span>
          )}
        </p>
      </div>
    </Link>
  );
}
