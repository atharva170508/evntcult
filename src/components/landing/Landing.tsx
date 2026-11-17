import Link from "next/link";
import { Suspense } from "react";
import { Plus, Search } from "lucide-react";
import type { LandingData } from "@/lib/data/landing";
import { EventCard } from "./EventCard";
import { KindRail } from "./KindRail";
import { Row } from "./Row";

const cta = "inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-lavender px-6 text-[16px] font-semibold text-ink ring-2 ring-inset ring-ink transition-colors hover:bg-lavender-hover active:scale-[0.98]";
const ghost = "inline-flex h-12 items-center justify-center gap-2 rounded-xl px-6 text-[16px] font-semibold text-ink ring-2 ring-inset ring-ink transition-colors hover:bg-ink/[0.04] active:scale-[0.98]";

const FAQ: [string, string][] = [
  ["Do I need to print my pass?", "No. Show the QR on your phone at the gate. A saved image of it works without internet too."],
  ["How do I pay for a paid event?", "By UPI, straight to the organizer. Add your UTR after paying and the organizer confirms it. Some events take payment at the desk instead."],
  ["Can I cancel?", "Yes, from your pass. Your seat goes to the next person on the waitlist."],
  ["Where's my certificate?", "In Certificates, once the organizer issues it. Anyone can check it's real from the code printed on it."],
  ["Who can see the photos?", "Only people registered for that event, and its organizer."],
  ["How do I host an event?", "Organizer accounts are approved by EvntCult. Write to evntcult@gmail.com and we'll set you up."],
];

/** Browse homepage: a short welcome for visitors, shelves of real events, hosting, questions. */
export function Landing({ data, signedIn = false, isOrganizer = false }: { data: LandingData; signedIn?: boolean; isOrganizer?: boolean }) {
  const hostHref = isOrganizer ? "/organizer/events/new" : "mailto:evntcult@gmail.com?subject=Organizer%20account";

  return (
    <div className="pb-6">
      {!signedIn && (
        <section aria-labelledby="hero-h" className="pb-10 pt-12 text-center md:pb-14 md:pt-16">
          <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-ink-muted">Campus events</p>
          <h1 id="hero-h" className="mx-auto mt-5 max-w-[12ch] font-display text-[clamp(52px,8vw,96px)] leading-[0.95]">
            Every event, <em>one pass.</em>
          </h1>
          <p className="mx-auto mt-6 max-w-[34ch] text-[18px] leading-snug text-ink-2 md:text-[20px]">Find it, register in a tap, walk in with a scan.</p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/signin?mode=signup" className={cta}>
              Get your pass
            </Link>
            <Link href="/events" className={ghost}>
              Browse events
            </Link>
          </div>
        </section>
      )}

      {/* Phones: the header has no room for the big bar, so search lives here. */}
      <form action="/events" method="get" role="search" className={signedIn ? "pt-4 md:hidden" : "pb-2 md:hidden"}>
        <label className="flex h-14 items-center gap-3 rounded-full border border-line-strong bg-white px-5 shadow-search">
          <Search className="size-5 shrink-0 text-ink" strokeWidth={2.4} aria-hidden />
          <input name="q" type="search" placeholder="Search events" className="min-w-0 flex-1 bg-transparent text-[15px] font-semibold text-ink outline-none placeholder:text-ink [&::-webkit-search-cancel-button]:hidden" />
        </label>
      </form>

      <div className="border-b border-line">
        <Suspense>
          <KindRail />
        </Suspense>
      </div>

      <div className="pt-4">
        {data.rows.length === 0 ? (
          <p className="py-24 text-center text-[16px] text-ink-muted">No upcoming events yet.</p>
        ) : (
          data.rows.map((r) => (
            <Row key={r.key} title={r.title} href={r.href}>
              {r.events.map((e) => (
                <li key={e.id}>
                  <EventCard e={e} />
                </li>
              ))}
            </Row>
          ))
        )}
      </div>

      <section id="hosts" aria-labelledby="hosts-h" className="bleed mt-16 scroll-mt-28 bg-night text-cream">
        <div className="mx-auto grid max-w-[1360px] gap-10 px-gutter py-20 md:grid-cols-2 md:items-end md:py-28">
          <h2 id="hosts-h" className="font-display text-[clamp(44px,6vw,80px)] leading-[0.98] tracking-[-0.03em] text-cream">
            Hosting? <em>We&apos;ll handle the door.</em>
          </h2>
          <div>
            <ul className="space-y-3 border-t border-cream/20 pt-6 text-[17px] text-cream/85">
              <li>Free or paid entry, with UPI</li>
              <li>A pass for every guest, a scanner for the gate</li>
              <li>Updates, photos and certificates after</li>
            </ul>
            <a href={hostHref} className="mt-8 inline-flex h-12 items-center gap-2 rounded-xl bg-lavender px-6 text-[16px] font-semibold text-ink ring-2 ring-inset ring-cream transition-colors hover:bg-lavender-hover">
              {isOrganizer ? (
                <>
                  <Plus className="size-4" strokeWidth={2.6} aria-hidden /> Create an event
                </>
              ) : (
                "Become an organizer"
              )}
            </a>
          </div>
        </div>
      </section>

      {!signedIn && (
        <section aria-labelledby="faq-h" className="grid gap-10 py-20 md:grid-cols-[1fr_1.4fr] md:py-28">
          <h2 id="faq-h" className="font-display text-[clamp(44px,6vw,72px)] leading-none tracking-[-0.03em]">
            Good <em>questions.</em>
          </h2>
          <div className="divide-y divide-line-strong border-y border-line-strong">
            {FAQ.map(([q, a]) => (
              <details key={q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-[18px] font-semibold text-ink [&::-webkit-details-marker]:hidden">
                  {q}
                  <Plus className="size-5 shrink-0 transition-transform duration-base group-open:rotate-45" aria-hidden />
                </summary>
                <p className="mt-3 max-w-[56ch] text-[16px] leading-relaxed text-ink-2">{a}</p>
              </details>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
