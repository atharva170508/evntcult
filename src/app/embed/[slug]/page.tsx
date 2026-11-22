import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getEventDetail, toSummary } from "@/lib/data/events";
import { EventArt } from "@/components/ui/EventArt";
import { formatINR } from "@/lib/money";
import { fmtDate, fmtTime } from "@/lib/utils";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false } };

/**
 * The Register card a club puts on its own website (Luma's "Embed Event"). Public events only.
 * Everything opens on EvntCult in a new tab, so sign-in and payment never happen inside a frame.
 */
export default async function EmbedPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ theme?: string }> }) {
  const { slug } = await params;
  const { theme } = await searchParams;
  const d = await getEventDetail(slug, null, null);
  if (!d || d.event.access !== "public" || !["published", "closed"].includes(d.event.status)) notFound();
  const e = d.event;
  const s = toSummary(e);
  const ended = Date.parse(e.ends_at) <= Date.now();
  const full = d.seatsLeft === 0;
  const href = `${SITE_URL}/events/${e.slug}?ref=embed`;
  const dark = theme === "dark";
  return (
    <main className={dark ? "dark min-h-dvh bg-[#141311] p-3" : "min-h-dvh bg-transparent p-3"}>
      <a
        href={href}
        target="_blank"
        rel="noopener"
        className="group flex max-w-[560px] gap-4 rounded-2xl border border-line bg-white p-3 text-ink shadow-[var(--lift-1)] transition-shadow hover:shadow-raised"
      >
        <span className="relative size-[112px] shrink-0 overflow-hidden rounded-xl bg-sunken">
          {e.banner_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={e.banner_url} alt="" className="size-full object-cover" />
          ) : (
            <EventArt accent={s.accent} seed={e.id} scrim={false} />
          )}
        </span>
        <span className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
          <span>
            <span className="block truncate font-display text-[22px] leading-tight text-ink">{e.title}</span>
            <span className="mt-1 block text-[13.5px] text-ink-muted">
              {fmtDate(s.startsAt, { weekday: "short", day: "numeric", month: "short" })}, {fmtTime(s.startsAt)}
              {e.venue ? `, ${e.venue}` : ""}
            </span>
          </span>
          <span className="mt-3 flex items-center justify-between gap-3">
            <span className="text-[14px] font-semibold tabular-nums text-ink">{e.price_paise > 0 ? `From ${formatINR(e.price_paise)}` : "Free"}</span>
            <span className="inline-flex h-10 items-center rounded-xl whitespace-nowrap bg-lavender px-4 text-[14px] font-semibold text-ink ring-2 ring-inset ring-ink">
              {ended ? "See the event" : full ? "Join the waitlist" : "Register"}
            </span>
          </span>
        </span>
      </a>
      <p className="mt-2 pl-1 text-[11.5px] text-ink-subtle">
        On <span className="font-semibold text-brand">evntcult</span>
      </p>
    </main>
  );
}
