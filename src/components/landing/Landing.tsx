import Link from "next/link";
import { Suspense } from "react";
import { Bell, Check, Plus, ScanLine, Search } from "lucide-react";
import type { LandingData } from "@/lib/data/landing";
import { Accordion } from "@/components/motion/Accordion";
import { Magnetic } from "@/components/motion/Magnetic";
import { Reveal } from "@/components/motion/Reveal";
import { Spotlight } from "@/components/motion/Spotlight";
import { EventCard } from "./EventCard";
import { KindRail } from "./KindRail";
import { Row } from "./Row";
import { AppBand, Closing, Featured, Hero, HowItWorks, KindBento, Numbers, Venues } from "./Sections";
import { EventArt } from "@/components/ui/EventArt";

const FAQ: [string, string][] = [
  ["Do I need to print my pass?", "No. Show the QR on your phone at the gate. A saved image of it works without internet too."],
  ["How do I pay for a paid event?", "By UPI, straight to the organizer. Add your UTR after paying and the organizer confirms it. Some events take payment at the desk instead."],
  ["Can I cancel?", "Yes, from your pass. Your seat goes to the next person on the waitlist."],
  ["Where's my certificate?", "In Certificates, once the organizer issues it. Anyone can check it's real from the code printed on it."],
  ["Who can see the photos?", "Only people registered for that event, and its organizer."],
  ["How do I host an event?", "Organizer accounts are approved by EvntCult. Write to evntcult@gmail.com and we'll set you up."],
];

const nf = new Intl.NumberFormat("en-IN");

/** A shelf of events. Browsing content is shown immediately — no entrance animation (antislop MO1). */
const shelf = (r: LandingData["rows"][number]) => (
  <Row key={r.key} title={r.title} href={r.href}>
    {r.events.map((e) => (
      <li key={e.id}>
        <EventCard e={e} />
      </li>
    ))}
  </Row>
);

/** Nothing scheduled and nothing recent: say so, and offer the next step. */
function EmptyCampus({ isOrganizer }: { isOrganizer: boolean }) {
  return (
    <section aria-labelledby="empty-h" className="my-6 grid overflow-hidden rounded-3xl border border-line-strong bg-white md:grid-cols-[1fr_1.2fr]">
      <div className="relative min-h-[200px]">
        <EventArt accent="pink" seed="empty-campus" scrim={false} />
      </div>
      <div className="p-8 md:p-12">
        <h2 id="empty-h" className="font-display text-[44px] leading-[0.95] tracking-[-0.03em] text-ink">
          The board is <em>clear.</em>
        </h2>
        <p className="mt-4 max-w-[40ch] text-[16px] text-ink-2">No events are scheduled right now. New ones appear here the moment an organizer publishes them.</p>
        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
          {isOrganizer ? (
            <Link href="/organizer/events/new" className="inline-flex h-12 items-center gap-2 rounded-xl bg-lavender px-6 text-[16px] font-semibold text-ink ring-2 ring-inset ring-ink transition-colors duration-fast hover:bg-lavender-hover">
              <Plus className="size-4" strokeWidth={2.6} aria-hidden /> Create an event
            </Link>
          ) : (
            <Link href="/calendar" className="inline-flex h-12 items-center rounded-xl bg-lavender px-6 text-[16px] font-semibold text-ink ring-2 ring-inset ring-ink transition-colors duration-fast hover:bg-lavender-hover">
              Open the calendar
            </Link>
          )}
          <a href="mailto:evntcult@gmail.com?subject=Event%20on%20EvntCult" className="text-[16px] font-semibold text-ink underline decoration-line-strong decoration-2 underline-offset-[6px] hover:decoration-ink">
            Tell us about an event
          </a>
        </div>
      </div>
    </section>
  );
}

/** The homepage: welcome, what's on, the featured event, shelves, kinds, venues, hosting, app, questions. */
export function Landing({ data, signedIn = false, isOrganizer = false }: { data: LandingData; signedIn?: boolean; isOrganizer?: boolean }) {
  const hostHref = isOrganizer ? "/organizer/events/new" : "mailto:evntcult@gmail.com?subject=Organizer%20account";

  return (
    <div className="pb-6">
      {!signedIn && <Hero upNext={data.ticker} recent={data.recent} />}

      {/* Phones: the header has no room for the big bar, so search lives here. */}
      <form action="/events" method="get" role="search" className="pt-5 md:hidden">
        <label className="flex h-14 items-center gap-3 rounded-full border border-line-strong bg-white px-5 shadow-search">
          <Search className="size-5 shrink-0 text-ink" strokeWidth={2.4} aria-hidden />
          <input name="q" type="search" placeholder="Search events" className="min-w-0 flex-1 bg-transparent text-[15px] font-semibold text-ink outline-none placeholder:text-ink [&::-webkit-search-cancel-button]:hidden" />
        </label>
      </form>

      <div className="mt-6 border-b border-line">
        <Suspense>
          <KindRail />
        </Suspense>
      </div>

      {data.featured && <Featured e={data.featured} />}

      <div className="pt-6">
        {data.rows.length === 0 ? <EmptyCampus isOrganizer={isOrganizer} /> : data.rows.slice(0, 2).map(shelf)}
      </div>

      <HowItWorks />

      <KindBento kinds={data.kinds} />

      {data.rows.slice(2).map(shelf)}

      <Venues venues={data.venues} />

      <Numbers upcoming={data.upcoming} going={data.going} checkins={data.checkins} />

      {/* Hosting: a dark band with a bento of what organizers get. */}
      <section id="hosts" aria-labelledby="hosts-h" className="bleed mt-16 scroll-mt-28 bg-night text-cream">
        <div className="mx-auto max-w-[1360px] px-gutter py-20 md:py-28">
          <Reveal className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <h2 id="hosts-h" className="max-w-[14ch] font-display text-[clamp(44px,6vw,80px)] leading-[0.95] tracking-[-0.03em] text-cream">
              Hosting? <em>We&apos;ll handle the door.</em>
            </h2>
            <Magnetic className="inline-block shrink-0">
              <a
                href={hostHref}
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-lavender px-6 text-[16px] font-semibold text-ink ring-2 ring-inset ring-cream transition-[background-color,transform] duration-fast hover:bg-lavender-hover active:scale-[0.97]"
              >
                {isOrganizer ? (
                  <>
                    <Plus className="size-4" strokeWidth={2.6} aria-hidden /> Create an event
                  </>
                ) : (
                  "Become an organizer"
                )}
              </a>
            </Magnetic>
          </Reveal>

          <Reveal className="mt-12 grid gap-4 md:grid-cols-4 md:grid-rows-[auto_auto]">
            {/* Scanner — the large tile */}
            <Spotlight className="flex flex-col overflow-hidden rounded-3xl bg-white/[0.04] p-7 shadow-glow md:col-span-2 md:row-span-2">
              <div className="relative z-[2]">
                <h3 className="text-[22px] font-semibold text-cream">Passes and a gate scanner</h3>
                <p className="mt-2 max-w-[36ch] text-[15px] leading-relaxed text-cream/65">Every guest gets a pass. Any phone becomes the door, and it keeps working offline.</p>
              </div>
              <div className="relative z-[2] mt-8 flex flex-1 items-end justify-center">
                <div className="relative w-[230px] rounded-3xl border border-white/10 bg-[#111] p-3 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.8)]">
                  <div className="rounded-[20px] bg-[#1d1d1d] p-4">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-cream/60">
                      <span>Gate</span>
                      <span className="inline-flex items-center gap-1 text-[#5EE0A8]">
                        <span className="size-1.5 rounded-full bg-[#5EE0A8]" aria-hidden /> Online
                      </span>
                    </div>
                    <div className="relative mx-auto mt-4 grid size-[132px] grid-cols-7 gap-[3px] overflow-hidden rounded-xl bg-white p-2.5" aria-hidden>
                      {Array.from({ length: 49 }, (_, i) => (
                        <span key={i} className={(i * 7 + (i % 5) * 3) % 3 === 0 || [0, 1, 7, 8, 5, 6, 12, 13, 35, 36, 42, 43].includes(i) ? "rounded-sm bg-ink" : "bg-transparent"} />
                      ))}
                      <span className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-accent/0 via-accent/40 to-accent/0 opacity-0 group-hover/spot:opacity-100 motion-safe:group-hover/spot:animate-[scan_1.6s_ease-in-out_infinite]" />
                    </div>
                    <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#5EE0A8]/15 px-3 py-2.5 text-[13px] font-semibold text-[#5EE0A8]">
                      <Check className="size-4" strokeWidth={3} aria-hidden /> Admitted
                    </div>
                  </div>
                </div>
              </div>
              {data.checkins > 0 && (
                <p className="relative z-[2] mt-6 text-[14px] text-cream/60">
                  <span className="font-semibold text-cream">{nf.format(data.checkins)}</span> scans at the gate so far
                </p>
              )}
            </Spotlight>

            {/* UPI */}
            <Spotlight className="overflow-hidden rounded-3xl bg-white/[0.04] p-7 shadow-glow">
              <div className="relative z-[2]">
                <h3 className="text-[18px] font-semibold text-cream">Free or paid</h3>
                <p className="mt-1.5 text-[14px] text-cream/65">Collect by UPI, confirm from one list.</p>
                <div className="mt-6 space-y-2">
                  <div className="flex items-center justify-between rounded-xl bg-white/[0.06] px-3.5 py-2.5 text-[13px]">
                    <span className="text-cream/80">UTR 4471…</span>
                    <span className="font-semibold text-cream">₹199</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-[#5EE0A8]/12 px-3.5 py-2.5 text-[13px] font-semibold text-[#5EE0A8]">
                    Confirmed <Check className="size-4" strokeWidth={3} aria-hidden />
                  </div>
                </div>
              </div>
            </Spotlight>

            {/* Updates */}
            <Spotlight className="overflow-hidden rounded-3xl bg-white/[0.04] p-7 shadow-glow">
              <div className="relative z-[2]">
                <h3 className="text-[18px] font-semibold text-cream">One message, every pass</h3>
                <p className="mt-1.5 text-[14px] text-cream/65">Time or venue changed? Everyone hears.</p>
                <div className="relative mt-6 h-[92px]">
                  <div className="absolute inset-x-3 top-0 h-10 rounded-xl bg-white/[0.05]" />
                  <div className="absolute inset-x-0 top-3 flex items-center gap-3 rounded-xl border border-white/10 bg-[#262626] px-3.5 py-3 transition-transform duration-base ease-out group-hover/spot:-translate-y-1">
                    <Bell className="size-4 shrink-0 text-lavender" aria-hidden />
                    <span className="text-[13px] leading-snug text-cream/85">Moved to Main Auditorium, 7:30 pm</span>
                  </div>
                </div>
              </div>
            </Spotlight>

            {/* After the night */}
            <Spotlight className="overflow-hidden rounded-3xl bg-white/[0.04] p-7 shadow-glow md:col-span-2">
              <div className="relative z-[2] flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-[18px] font-semibold text-cream">After the night</h3>
                  <p className="mt-1.5 max-w-[30ch] text-[14px] text-cream/65">Photos people can find themselves in. Certificates anyone can verify.</p>
                </div>
                <div className="flex items-end gap-3" aria-hidden>
                  <div className="grid grid-cols-2 gap-1.5">
                    {["#E8743A", "#4B2E86", "#11796D", "#C7457A"].map((c) => (
                      <span key={c} className="size-11 rounded-lg" style={{ background: c }} />
                    ))}
                  </div>
                  <div className="w-[150px] rotate-[3deg] rounded-xl bg-cream p-3 text-ink shadow-[0_20px_40px_-16px_rgba(0,0,0,0.7)] transition-transform duration-slow ease-out">
                    <p className="text-[9px] font-semibold text-ink-muted">Certificate of participation</p>
                    <p className="mt-1 font-display text-[18px] italic leading-none">Your name</p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="h-px w-12 bg-ink/40" />
                      <ScanLine className="size-4 text-ink/70" />
                    </div>
                  </div>
                </div>
              </div>
            </Spotlight>
          </Reveal>
          <p className="mt-4 text-[12.5px] text-cream/50">Example screens. Your own events show your guests, payments and messages.</p>
        </div>
      </section>

      <AppBand />

      <section aria-labelledby="faq-h" className="grid gap-10 py-20 md:grid-cols-[1fr_1.4fr] md:py-28">
          <Reveal>
            <h2 id="faq-h" className="font-display text-[clamp(44px,6vw,72px)] leading-none tracking-[-0.03em]">
              Good <em>questions.</em>
            </h2>
          </Reveal>
          <Reveal delay={0.08}>
            <Accordion items={FAQ} />
          </Reveal>
        </section>

      {!signedIn && <Closing />}
    </div>
  );
}
