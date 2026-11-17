import Link from "next/link";
import { EventArt } from "@/components/ui/EventArt";
import { Spotlight } from "@/components/motion/Spotlight";
import { formatINR } from "@/lib/money";
import { fmtDate, fmtTime } from "@/lib/utils";
import type { EventSummary } from "@/lib/data/types";

export function seatState(e: Pick<EventSummary, "capacity" | "registered" | "startsAt" | "endsAt">, now = new Date()) {
  if (+e.startsAt <= +now && +now < +e.endsAt) return "live" as const;
  if (e.capacity && e.registered >= e.capacity) return "full" as const;
  if (e.capacity && e.registered / e.capacity >= 0.8) return "filling" as const;
  return "open" as const;
}

/** Event card: artwork, one badge at most, then the facts. */
export function EventCard({ e }: { e: EventSummary }) {
  const state = seatState(e);
  const left = e.capacity ? Math.max(0, e.capacity - e.registered) : null;
  const badge = state === "live" ? "Live now" : state === "full" ? "Full" : state === "filling" ? "Almost full" : null;

  return (
    <Link href={`/events/${e.slug}`} className="group block rounded-[20px] outline-offset-4">
      <Spotlight
        tone="light"
        className="aspect-[20/19] overflow-hidden rounded-[20px] bg-sunken shadow-[0_0_0_1px_rgba(60,40,10,0.04)] transition-[transform,box-shadow] duration-slow ease-out group-hover:-translate-y-1 group-hover:shadow-[0_18px_36px_-16px_rgba(60,40,10,0.35)]"
      >
        <EventArt accent={e.accent} seed={e.id} scrim={false} className="transition-transform duration-500 ease-out group-hover:scale-[1.04]" />
        {badge && (
          <span className="absolute left-3 top-3 z-[2] inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[12.5px] font-semibold text-ink shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_2px_6px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.1)] backdrop-blur">
            {state === "live" && <span className="size-1.5 rounded-full bg-accent motion-safe:animate-pulse" aria-hidden />}
            {badge}
          </span>
        )}
      </Spotlight>
      <div className="pt-3">
        <h3 className="truncate text-[15px] font-semibold text-ink">{e.title}</h3>
        <p className="mt-0.5 truncate text-[14px] text-ink-muted">
          {fmtDate(e.startsAt, { weekday: "short", day: "numeric", month: "short" })} · {fmtTime(e.startsAt)}
        </p>
        <p className="truncate text-[14px] text-ink-muted">{e.venueName ?? "Venue TBA"}</p>
        <p className="mt-1 text-[14px] text-ink">
          <span className="font-semibold">{e.feePaise ? formatINR(e.feePaise) : "Free"}</span>
          {left !== null && state !== "full" && state !== "live" && left <= 50 && <span className="text-ink-muted"> · {left} left</span>}
        </p>
      </div>
    </Link>
  );
}
