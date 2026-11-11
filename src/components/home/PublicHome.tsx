import type { EventSummary } from "@/lib/data/types";
import { LinkButton } from "@/components/ui/Button";
import { Ticket } from "@/components/ui/Ticket";
import { CATEGORY_LABEL, SectionHead, StatRow } from "@/components/dashboard/sections";
import { formatINR } from "@/lib/money";
import { fmtDate, fmtTime } from "@/lib/utils";
import { PreviewLock } from "./PreviewLock";

export interface PublicHomeData {
  campus: EventSummary[];
  thisWeek: number;
  upcoming: number;
  going: number;
  /** QR for the sample OnePass: scanning it opens sign-up. */
  onePassQr: string;
}

const STEPS = [
  { title: "Register", body: "Pick an event and tap Register. Your pass is ready straight away. If it's full, join the waitlist." },
  { title: "Show your pass", body: "One QR for every event you join. No paper, no forms at the door." },
  { title: "Get scanned in", body: "Organizers scan it in under a second, and it still works when the Wi-Fi drops." },
  { title: "Prove you were there", body: "Your certificate appears once you're scanned in, along with the event photos you're in." },
];

/** What a signed-out visitor sees. Every number is a live count; event rows are a preview and never open an event. */
export function PublicHome({ data }: { data: PublicHomeData }) {
  const events = data.campus;
  return (
    <div className="mx-auto flex max-w-marketing flex-col gap-24 pb-12 pt-12 md:gap-32 md:pt-24">
      {/* Hero: words first, left-aligned. No art behind. */}
      <section className="max-w-[720px]">
        <p className="eyebrow">EvntCult</p>
        <h1 className="mt-3 font-display text-display">Every campus event. One place.</h1>
        <p className="mt-6 max-w-prose text-body text-ink-muted">
          Fests, game nights, parties and workshops in one calendar. Register in a tap, walk in with one pass, and get proof you were there. Organizers see who actually came, not just who said they would.
        </p>
        <p className="mt-6 font-mono text-label text-ink-subtle">Register › Pass › Scan › Attend › Prove it</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <LinkButton href="/signin?mode=signup" size="lg">
            Sign up
          </LinkButton>
          <LinkButton href="/signin" size="lg" variant="secondary">
            Log in
          </LinkButton>
          <LinkButton href={`/signin?next=${encodeURIComponent("/organizer/events/new")}`} size="lg" variant="ghost">
            Host an event ›
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

      {/* 02 Live counts */}
      <section aria-label="Right now">
        <SectionHead n="02" title="Right now" />
        <StatRow
          items={[
            { label: "Events this week", value: data.thisWeek.toLocaleString("en-IN") },
            { label: "Upcoming events", value: data.upcoming.toLocaleString("en-IN") },
            { label: "People going", value: data.going.toLocaleString("en-IN") },
          ]}
        />
      </section>

      {/* 03 What's on — preview only */}
      {events.length > 0 && (
        <section aria-label="What's on">
          <SectionHead n="03" title="What's on" action={<span className="font-mono text-caption text-ink-subtle">Preview · sign up to open</span>} />
          <ul className="border-t border-line">
            {events.slice(0, 6).map((e) => (
              <li key={e.id} className="border-b border-line">
                <PreviewLock label={e.title}>
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 py-3 hover:bg-white/[0.03] sm:grid-cols-[120px_minmax(0,1fr)_minmax(0,180px)_80px]">
                    <span className="font-mono text-label text-ink-muted sm:order-none">
                      {fmtDate(e.startsAt, { weekday: "short", day: "numeric", month: "short" })} {fmtTime(e.startsAt)}
                    </span>
                    <span className="col-span-2 min-w-0 sm:col-span-1">
                      <span className="block truncate font-display text-title uppercase">{e.title}</span>
                      <span className="block font-mono text-caption text-ink-subtle">{CATEGORY_LABEL[e.category]}</span>
                    </span>
                    <span className="hidden truncate font-mono text-label text-ink-muted sm:block">{e.venueName}</span>
                    <span className="row-start-1 text-right font-mono text-label sm:row-auto">{e.feePaise > 0 ? formatINR(e.feePaise) : "Free"}</span>
                  </div>
                </PreviewLock>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Closing */}
      <section className="flex flex-col items-start justify-between gap-6 border-t border-line pt-12 md:flex-row md:items-end">
        <h2 className="max-w-[720px] font-display text-heading">Never miss what&apos;s happening on campus.</h2>
        <div className="flex flex-wrap gap-3">
          <LinkButton href="/signin?mode=signup" size="lg">
            Get started
          </LinkButton>
          <LinkButton href="/get-app" size="lg" variant="secondary">
            Get the app
          </LinkButton>
        </div>
      </section>
    </div>
  );
}
