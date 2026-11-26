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
  Venues,
} from "./Sections";
import { OnePassInteractive } from "./OnePassInteractive";
import { VaultSpotlight } from "./VaultSpotlight";
import { SavingsCalculator } from "./SavingsCalculator";
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
          The board is clear.
        </h2>
        <p className="mt-4 max-w-[40ch] text-[16px] text-ink-2">
          No events are scheduled right now. New ones appear here the moment an
          organizer publishes them.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
          {isOrganizer ? (
            <Link
              href="/organizer/events/new"
              className="inline-flex h-12 items-center gap-2 rounded-xl whitespace-nowrap bg-lavender px-6 text-[16px] font-semibold text-ink ring-2 ring-inset ring-ink transition-colors duration-fast hover:bg-lavender-hover"
            >
              <Plus className="size-4" strokeWidth={2.6} aria-hidden /> Create
              an event
            </Link>
          ) : (
            <Link
              href="/calendar"
              className="inline-flex h-12 items-center rounded-xl whitespace-nowrap bg-lavender px-6 text-[16px] font-semibold text-ink ring-2 ring-inset ring-ink transition-colors duration-fast hover:bg-lavender-hover"
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

/** Your month: your registrations and events you host, plus other events. */
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
 * The homepage for visitors: 100% cohesive Dark Obsidian Twilight (#121110) from top pixel to footer.
 * Zero horizontal scroll, zero 100vw bleed overflow, sticky scroll-scrubbed 2-act hero into 3 crisp chapters.
 */
export function PublicHome() {
  return (
    <div className="relative w-full bg-[#121110] text-[#EDE3DA]">
      <Hero />
      <OnePassInteractive />
      <VaultSpotlight />
      <SavingsCalculator />
      <Closing tone="dark" />
      <PublicDarkFooter />
    </div>
  );
}

function PublicDarkFooter() {
  return (
    <footer className="w-full border-t border-white/10 bg-[#0D0C0B] text-[#EDE3DA]">
      <div className="mx-auto flex max-w-[1360px] flex-col gap-6 px-gutter py-10 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-display text-[22px] leading-tight text-[#EDE3DA]">
            evntcult<span className="text-[#E3264F]">.</span>
          </p>
          <p className="mt-1 text-[13px] text-[#EDE3DA]/55">
            Built by Synchronous Labs for college clubs, fests, and campus communities.
          </p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] font-medium text-[#EDE3DA]/70">
          <Link href="/events" className="transition-colors hover:text-[#F0D7FF]">Events</Link>
          <Link href="/calendar" className="transition-colors hover:text-[#F0D7FF]">Calendar</Link>
          <Link href="/venues" className="transition-colors hover:text-[#F0D7FF]">Venues</Link>
          <Link href="/host" className="transition-colors hover:text-[#F0D7FF]">Host an event</Link>
          <Link href="/signin" className="transition-colors hover:text-[#F0D7FF]">Sign in</Link>
          <Link href="/terms" className="transition-colors hover:text-[#F0D7FF]">Terms</Link>
        </nav>
      </div>
    </footer>
  );
}

function Questions({ tone = "light" }: { tone?: "light" | "dark" }) {
  const dark = tone === "dark";
  return (
    <section
      aria-labelledby="faq-h"
      className={
        dark
          ? "bleed border-t border-white/10 bg-[#121110] py-20 text-[#EDE3DA] md:py-28"
          : "grid gap-10 py-20 md:grid-cols-[1fr_1.4fr] md:py-28"
      }
    >
      <div className={dark ? "mx-auto grid max-w-[1360px] gap-10 px-gutter md:grid-cols-[1fr_1.4fr]" : "contents"}>
        <Reveal>
          <h2
            id="faq-h"
            className={`font-display text-[clamp(44px,6vw,72px)] leading-none tracking-[-0.03em] ${dark ? "text-[#EDE3DA]" : "text-ink"}`}
          >
            Good questions.
          </h2>
        </Reveal>
        <Reveal delay={0.08}>
          <Accordion items={FAQ} tone={tone} />
        </Reveal>
      </div>
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
  app = false,
}: {
  data: LandingData;
  month: MonthPayload;
  isOrganizer?: boolean;
  /** Signed-in home: on phones, skip what the tabs and header already give (calendar, search, venues, the pitch). */
  app?: boolean;
}) {
  const offPhone = app ? "max-md:hidden" : undefined;
  return (
    <div className="pb-6">
      <div className={offPhone}>
        <CampusCalendar month={month} />
      </div>

      {/* Phones: the header has no room for the big bar, so search lives here. */}
      <form
        action="/events"
        method="get"
        role="search"
        className={app ? "hidden" : "pt-5 md:hidden"}
      >
        <label className="flex h-14 items-center gap-3 rounded-lg border border-line-strong bg-white px-5 shadow-search">
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

      {data.featured && (
        <div className={offPhone}>
          <Featured e={data.featured} />
        </div>
      )}

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

      <div className={offPhone}>
        <Venues venues={data.venues} />
        <HostsBand isOrganizer={isOrganizer} />
        <AppBand />
        <Questions />
      </div>
    </div>
  );
}

/** How an event runs on EvntCult: a dark band with a run of show and working demos. Shown to visitors and signed-in people. */
export function HostsBand({ isOrganizer = false, seamless = false }: { isOrganizer?: boolean; seamless?: boolean }) {
  const hostHref = isOrganizer ? "/organizer/events/new" : "/host";
  return (
    <section
      id="hosts"
      aria-labelledby="hosts-h"
      className={`bleed scroll-mt-28 bg-[#121110] text-cream ${seamless ? "border-t border-white/10" : "mt-16"}`}
    >
      <div className="mx-auto max-w-[1360px] px-gutter py-20 md:py-28">
        <Reveal className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <h2
            id="hosts-h"
            className="max-w-[30ch] font-display text-[clamp(30px,3.4vw,46px)] leading-[1.12] tracking-[-0.02em] text-cream"
          >
            Run the whole event from one place.{" "}
            <span className="text-cream/45">Sign-ups, payments, the door, the photos.</span>
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
      </div>
    </section>
  );
}
