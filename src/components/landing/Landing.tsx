import Link from "next/link";
import { Plus, Search } from "lucide-react";
import type { LandingData } from "@/lib/data/landing";
import type { MonthPayload } from "@/lib/data/calendar";
import { MonthCalendar } from "@/components/calendar/MonthCalendar";
import { Accordion } from "@/components/motion/Accordion";
import { Magnetic } from "@/components/motion/Magnetic";
import { Reveal } from "@/components/motion/Reveal";
import { EventCard } from "./EventCard";
import { Row } from "./Row";
import {
  AppBand,
  Closing,
  Featured,
  Hero,
  HowItWorks,
  Numbers,
  Venues,
} from "./Sections";
import { DashboardPreview } from "./DashboardPreview";
import { DiscoverFeed } from "./DiscoverFeed";
import { OrganizerBento } from "./OrganizerBento";
import { EventArt } from "@/components/ui/EventArt";

const FAQ: [string, string][] = [
  [
    "Do I need to print my pass?",
    "No. Show the QR on your phone at the gate. A saved image of it works without internet too.",
  ],
  [
    "How do I pay for a paid event?",
    "By UPI, straight to the organizer. Add your UTR after paying and the organizer confirms it. Some events take payment at the desk instead.",
  ],
  [
    "Can I cancel?",
    "Yes, from your pass. Your seat goes to the next person on the waitlist.",
  ],
  [
    "Where's my certificate?",
    "In Certificates, once the organizer issues it. Anyone with an EvntCult account can check it's real from the code printed on it.",
  ],
  [
    "Who can see the photos?",
    "Only people registered for that event, and its organizer.",
  ],
  [
    "How do I host an event?",
    "Organizer accounts are approved by EvntCult. Sign up, then choose Apply to host events in your account menu.",
  ],
];

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
    <section
      aria-labelledby="empty-h"
      className="my-6 grid overflow-hidden rounded-3xl border border-line-strong bg-white md:grid-cols-[1fr_1.2fr]"
    >
      <div className="relative min-h-[200px]">
        <EventArt accent="pink" seed="empty-campus" scrim={false} />
      </div>
      <div className="p-8 md:p-12">
        <h2
          id="empty-h"
          className="font-display text-[44px] leading-[0.95] tracking-[-0.03em] text-ink"
        >
          The board is <em>clear.</em>
        </h2>
        <p className="mt-4 max-w-[40ch] text-[16px] text-ink-2">
          No events are scheduled right now. New ones appear here the moment an
          organizer publishes them.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
          {isOrganizer ? (
            <Link
              href="/organizer/events/new"
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-lavender px-6 text-[16px] font-semibold text-ink ring-2 ring-inset ring-ink transition-colors duration-fast hover:bg-lavender-hover"
            >
              <Plus className="size-4" strokeWidth={2.6} aria-hidden /> Create
              an event
            </Link>
          ) : (
            <Link
              href="/calendar"
              className="inline-flex h-12 items-center rounded-xl bg-lavender px-6 text-[16px] font-semibold text-ink ring-2 ring-inset ring-ink transition-colors duration-fast hover:bg-lavender-hover"
            >
              Open the calendar
            </Link>
          )}
          <a
            href="mailto:evntcult@gmail.com?subject=Event%20on%20EvntCult"
            className="text-[16px] font-semibold text-ink underline decoration-line-strong decoration-2 underline-offset-[6px] hover:decoration-ink"
          >
            Tell us about an event
          </a>
        </div>
      </div>
    </section>
  );
}

/** Your month: your registrations and events you host, plus campus events. */
function CampusCalendar({ month }: { month: MonthPayload }) {
  return (
    <section
      id="calendar"
      aria-labelledby="calendar-h"
      className="scroll-mt-28 pt-10"
    >
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <h2
          id="calendar-h"
          className="text-[22px] font-semibold tracking-[-0.01em] text-ink"
        >
          Your calendar
        </h2>
        <Link
          href="/calendar"
          className="text-[15px] font-semibold text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink"
        >
          Full calendar
        </Link>
      </div>
      <MonthCalendar initial={month} signedIn />
    </section>
  );
}

/**
 * The homepage for visitors: welcome, OnePass, a labelled example of the signed-in home, the app,
 * questions and sign-up. Nothing real (event names, dates, venues, people or counts) is shown or
 * even loaded until someone signs in.
 */
export function PublicHome() {
  return (
    <div className="pb-6">
      <Hero />
      <HowItWorks />
      <DashboardPreview />
      <HostsBand />
      <AppBand />
      <Questions />
      <Closing />
    </div>
  );
}

function Questions() {
  return (
    <section
      aria-labelledby="faq-h"
      className="grid gap-10 py-20 md:grid-cols-[1fr_1.4fr] md:py-28"
    >
      <Reveal>
        <h2
          id="faq-h"
          className="font-display text-[clamp(44px,6vw,72px)] leading-none tracking-[-0.03em]"
        >
          Good <em>questions.</em>
        </h2>
      </Reveal>
      <Reveal delay={0.08}>
        <Accordion items={FAQ} />
      </Reveal>
    </section>
  );
}

/**
 * The signed-in homepage below the greeting: your calendar, then what's on, shelves, venues,
 * numbers, the hosting band, the app and questions.
 */
export function Landing({
  data,
  month,
  isOrganizer = false,
}: {
  data: LandingData;
  month: MonthPayload;
  isOrganizer?: boolean;
}) {
  return (
    <div className="pb-6">
      <CampusCalendar month={month} />

      {/* Phones: the header has no room for the big bar, so search lives here. */}
      <form
        action="/events"
        method="get"
        role="search"
        className="pt-5 md:hidden"
      >
        <label className="flex h-14 items-center gap-3 rounded-full border border-line-strong bg-white px-5 shadow-search">
          <Search
            className="size-5 shrink-0 text-ink"
            strokeWidth={2.4}
            aria-hidden
          />
          <input
            name="q"
            type="search"
            placeholder="Search events"
            className="min-w-0 flex-1 bg-transparent text-[15px] font-semibold text-ink outline-none placeholder:text-ink [&::-webkit-search-cancel-button]:hidden"
          />
        </label>
      </form>

      {data.featured && <Featured e={data.featured} />}

      {data.discover.length === 0 ? (
        <div className="pt-6">
          <EmptyCampus isOrganizer={isOrganizer} />
        </div>
      ) : (
        <DiscoverFeed events={data.discover} />
      )}

      <div className="pt-10">
        {data.rows.filter((r) => r.key === "recent").map(shelf)}
      </div>

      <Venues venues={data.venues} />

      <Numbers
        upcoming={data.upcoming}
        going={data.going}
        checkins={data.checkins}
      />

      <HostsBand isOrganizer={isOrganizer} />

      <AppBand />

      <Questions />
    </div>
  );
}

/** Why organizers switch: a dark band with working demos. Shown to visitors and signed-in people. */
export function HostsBand({ isOrganizer = false }: { isOrganizer?: boolean }) {
  const hostHref = isOrganizer ? "/organizer/events/new" : "/host";
  return (
    <section
      id="hosts"
      aria-labelledby="hosts-h"
      className="bleed mt-16 scroll-mt-28 bg-night text-cream"
    >
      <div className="mx-auto max-w-[1360px] px-gutter py-20 md:py-28">
        <Reveal className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <h2
            id="hosts-h"
            className="max-w-[14ch] font-display text-[clamp(44px,6vw,80px)] leading-[0.95] tracking-[-0.03em] text-cream"
          >
            Why organizers <em>switch.</em>
          </h2>
          <Magnetic className="inline-block shrink-0">
            <a
              href={hostHref}
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-lavender px-6 text-[16px] font-semibold text-ink ring-2 ring-inset ring-cream transition-[background-color,transform] duration-fast hover:bg-lavender-hover active:scale-[0.97]"
            >
              {isOrganizer ? (
                <>
                  <Plus className="size-4" strokeWidth={2.6} aria-hidden />{" "}
                  Create an event
                </>
              ) : (
                "Apply to host events"
              )}
            </a>
          </Magnetic>
        </Reveal>

        <OrganizerBento />
        <p className="mt-4 text-[12.5px] text-cream/50">
          Example data. Try them: your own events show your real guests,
          payments and photos.
        </p>
      </div>
    </section>
  );
}
