import type { EventSummary } from "@/lib/data/types";
import type { MonthPayload } from "@/lib/data/calendar";
import { MonthCalendar } from "@/components/calendar/MonthCalendar";
import { LinkButton } from "@/components/ui/Button";
import { Ticket } from "@/components/ui/Ticket";
import { SectionHead, StatRow } from "@/components/dashboard/sections";

export interface PublicHomeData {
  campus: EventSummary[];
  thisWeek: number;
  upcoming: number;
  going: number;
  /** QR for the sample OnePass: scanning it opens sign-up. */
  onePassQr: string;
  /** This month's public events, for the calendar. */
  month: MonthPayload;
}

const STEPS = [
  { title: "Register", body: "Pick an event and tap Register. Your pass is ready straight away. If it's full, join the waitlist." },
  { title: "Show your pass", body: "One QR for every event you join. No paper, no forms at the door." },
  { title: "Get scanned in", body: "Organizers scan it in under a second, and it still works when the Wi-Fi drops." },
  { title: "Prove you were there", body: "Your certificate appears once you're scanned in, along with the event photos you're in." },
];

/** What a signed-out visitor sees: EvntCult first, then OnePass, then the real calendar. Every number is a live count. No hosting here (approved organizers only). */
export function PublicHome({ data }: { data: PublicHomeData }) {
  return (
    <div className="mx-auto flex max-w-marketing flex-col gap-24 pb-12 pt-12 md:gap-32 md:pt-24">
      {/* Hero: EvntCult as a whole — every event, one calendar, live updates. Words first, no art behind. */}
      <section className="max-w-[720px]">
        <p className="eyebrow">EvntCult</p>
        <h1 className="mt-3 font-display text-display">Every campus event. One place.</h1>
        <p className="mt-6 max-w-prose text-body text-ink-muted">
          Fests, game nights, parties and workshops from every club, on one calendar. Register in a tap, get a live update the moment a time or venue changes, and never find out about an event the day after.
        </p>
        <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 font-mono text-label text-ink-subtle">
          <li>One calendar for every club</li>
          <li>Live updates</li>
          <li>One pass at the gate</li>
        </ul>
        <div className="mt-8 flex flex-wrap gap-3">
          <LinkButton href="/signin?mode=signup" size="lg">
            Sign up free
          </LinkButton>
          <LinkButton href="/signin" size="lg" variant="secondary">
            Log in
          </LinkButton>
          <LinkButton href="#calendar" size="lg" variant="ghost">
            See this month ›
          </LinkButton>
        </div>
      </section>

      {/* 01 OnePass */}
      <section aria-label="OnePass">
        <SectionHead n="01" title="OnePass" />
        <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_520px]">
          <ol className="border-t border-line">
            {STEPS.map((s, i) => (
              <li key={s.title} className="grid grid-cols-[48px_minmax(0,1fr)] border-b border-line py-4">
                <span className="font-mono text-label text-ink-subtle">0{i + 1}</span>
                <div>
                  <p className="text-body font-semibold">{s.title}</p>
                  <p className="mt-1 max-w-prose text-body text-ink-muted">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
          <div>
            <Ticket
              label="Sample OnePass. Scanning its QR opens EvntCult sign-up."
              category="Sample"
              title="OnePass"
              dateLabel="Every event"
              time={null}
              venue="you join"
              tagline="Scan the code to sign up"
              qrValue={null}
              qrSvg={data.onePassQr}
              passCode="EVC-SAMPLE"
              priceLabel="Free"
              seatsLabel="one pass"
            />
          </div>
        </div>
      </section>

      {/* 02 The calendar — what's on, this month, from every club. */}
      <section id="calendar" aria-label="This month" className="scroll-mt-20">
        <SectionHead n="02" title="What's on this month" action={<span className="font-mono text-caption text-ink-subtle">Sign up to register</span>} />
        <MonthCalendar initial={data.month} signedIn={false} />
        <div className="mt-8">
          <StatRow
            items={[
              { label: "Events this week", value: data.thisWeek.toLocaleString("en-IN") },
              { label: "Upcoming events", value: data.upcoming.toLocaleString("en-IN") },
              { label: "People going", value: data.going.toLocaleString("en-IN") },
            ]}
          />
        </div>
      </section>

      {/* Closing */}
      <section className="flex flex-col items-start justify-between gap-6 border-t border-line pt-12 md:flex-row md:items-end">
        <div>
          <h2 className="max-w-[720px] font-display text-heading">Never miss what&apos;s happening on campus.</h2>
          <p className="mt-2 text-body text-ink-muted">Signing up is free. Paid events show their price before you register.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <LinkButton href="/signin?mode=signup" size="lg" variant="secondary">
            Sign up free
          </LinkButton>
          <LinkButton href="/get-app" size="lg" variant="secondary">
            Get the app
          </LinkButton>
        </div>
      </section>
    </div>
  );
}
