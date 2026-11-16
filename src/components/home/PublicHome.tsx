import {
  ArrowRight,
  CalendarCheck2,
  LayoutGrid,
  Radio,
  ArrowUpRight,
  BellRing,
  Camera,
  Check,
  CloudOff,
  Download,
  MapPin,
  Megaphone,
  ScanLine,
  ShieldCheck,
  Ticket,
  Users,
} from "lucide-react";
import type { EventSummary } from "@/lib/data/types";
import { LogoIcon } from "@/components/brand/MissingE";
import { Marquee } from "@/components/brand/Marquee";
import { EventArt } from "@/components/ui/EventArt";
import { LinkButton } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/Section";
import { Countdown } from "@/components/dashboard/Countdown";
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

const CATEGORY_LABEL: Record<string, string> = { GAMING: "Gaming", SPORTS: "Sports", TECH: "Tech", CULTURAL: "Cultural", WORKSHOP: "Workshop", TALK: "Talk", PARTY: "Party" };

const STEPS = [
  { icon: Ticket, title: "Register in a tap", body: "Pick an event, tap Register and your OnePass is ready instantly. Full? Join the waitlist and we hold a seat for you when one opens." },
  { icon: ScanLine, title: "Fast-track entry", body: "Show the QR at the gate and you're in. Organizers scan it in a second, even when the Wi-Fi drops." },
  { icon: BellRing, title: "Always up to date", body: "Time or venue changed? Updates from the organizer show up right on your dashboard." },
  { icon: Camera, title: "Relive it after", body: "Your certificate of attendance appears the moment you're scanned in, and you can save the event photos you're in." },
];

const ORGANIZER_FEATURES = [
  { icon: CloudOff, title: "Scans without Wi-Fi", body: "The gate scanner keeps working offline and syncs when the network is back." },
  { icon: Users, title: "Live headcount", body: "Watch check-ins climb in real time against registrations and capacity." },
  { icon: Megaphone, title: "Broadcast updates", body: "Move a venue or a start time and every attendee sees it on their dashboard." },
  { icon: ShieldCheck, title: "Clash checks", body: "Drafts are checked against booked venues and major campus events before you publish." },
  { icon: Download, title: "Attendees & CSV", body: "Payments, check-ins and the guest list, exportable in one click." },
];

/** What a signed-out visitor sees. Event cards are a preview only: they never open an event. */
export function PublicHome({ data }: { data: PublicHomeData }) {
  const events = data.campus;
  const [next, ...rest] = events;

  return (
    <div className="relative mx-[calc(50%-50vw)] w-screen">
      {/* ── 1. Hero ─────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden px-gutter pb-16 pt-10 md:pb-24 md:pt-16">
        <div aria-hidden className="dot-grid absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_60%_70%_at_75%_30%,black,transparent_70%)]" />
        <div className="mx-auto grid max-w-shell items-center gap-14 lg:grid-cols-[1.15fr_0.85fr] lg:gap-10">
          <div className="animate-fade-up">
            <p className="inline-flex items-center gap-2.5 rounded-full bg-surface py-1.5 pl-2 pr-3.5 text-[13px] font-medium text-ink-2 shadow-card">
              <span className="flex items-center gap-1.5 rounded-full bg-accent-soft px-2 py-0.5 font-mono text-[11px] uppercase tracking-[0.08em] text-accent-ink">
                <span className="size-1.5 rounded-full bg-accent motion-safe:animate-pulse-dot" aria-hidden /> Live
              </span>
              {data.thisWeek > 0 ? `${data.thisWeek} event${data.thisWeek === 1 ? "" : "s"} this week` : "Welcome to EvntCult"}
            </p>
            <h1 className="mt-8 text-display-2xl font-semibold text-ink">
              Every event.
              <br />
              One <em>place.</em>
            </h1>
            <p className="mt-7 max-w-[34rem] text-lead text-ink-muted">
              EvntCult brings every fest, game night and workshop together. Your calendar fills itself, organizers&apos; updates reach you live, clash detection keeps events from colliding, and{" "}
              <span className="font-medium text-ink">OnePass</span> gets you in with one tap.
            </p>
            <ul className="mt-7 flex max-w-xl flex-wrap gap-1.5" aria-label="What EvntCult does">
              {[
                { icon: LayoutGrid, label: "All events, one place" },
                { icon: CalendarCheck2, label: "Calendar that fills itself" },
                { icon: Radio, label: "Live updates" },
                { icon: ShieldCheck, label: "Clash detection" },
                { icon: Ticket, label: "OnePass entry" },
              ].map((f) => (
                <li key={f.label} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-surface px-3 text-[13px] font-medium text-ink-2 shadow-card">
                  <f.icon className="size-3.5 text-ink-subtle" aria-hidden /> {f.label}
                </li>
              ))}
            </ul>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <LinkButton href="/signin?mode=signup" variant="accent" size="lg" className="group">
                Sign up free <ArrowRight className="size-4 transition-transform duration-base ease-out group-hover:translate-x-0.5" aria-hidden />
              </LinkButton>
              <LinkButton href="/events" variant="secondary" size="lg">
                Browse events
              </LinkButton>
              <LinkButton href={`/signin?next=${encodeURIComponent("/organizer/events/new")}`} variant="ghost" size="lg">
                Host an event <ArrowRight className="size-4" aria-hidden />
              </LinkButton>
            </div>

            <dl className="mt-14 grid max-w-lg grid-cols-3 divide-x divide-line border-y border-line">
              {[
                { v: data.thisWeek, l: "This week" },
                { v: data.upcoming, l: "Upcoming" },
                { v: data.going, l: "People going" },
              ].map((s) => (
                <div key={s.l} className="flex flex-col-reverse px-4 py-4 first:pl-0">
                  <dt className="mt-0.5 text-[12.5px] text-ink-muted">{s.l}</dt>
                  <dd className="font-mono text-[28px] font-medium tabular-nums tracking-[-0.04em] text-ink">{s.v.toLocaleString("en-IN")}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Ticket stack: the next event fanned behind the sample pass. */}
          <div className="relative mx-auto h-[460px] w-full max-w-[400px] animate-fade-up [animation-delay:120ms] md:h-[520px]">
            {next && (
            <PreviewLock label={next.title} className="absolute right-0 top-0 w-[78%] rotate-[5deg] rounded-card transition-transform duration-slow ease-out hover:rotate-[3deg]">
              <div className="overflow-hidden rounded-card bg-surface shadow-raised">
                <div className="relative aspect-[4/3]">
                  <EventArt accent={next.accent} />
                  <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-ink">
                    {fmtDate(next.startsAt, { day: "numeric", month: "short" })}
                  </span>
                  <p className="absolute inset-x-4 bottom-3 text-[22px] font-semibold leading-tight tracking-tighter text-white">{next.title}</p>
                </div>
                <div className="flex items-center justify-between px-4 py-3 text-[12.5px] text-ink-muted">
                  <span>{fmtTime(next.startsAt)}</span>
                  {next.venueName && <span className="truncate pl-3">{next.venueName}</span>}
                </div>
              </div>
            </PreviewLock>
            )}

            <article aria-label="Sample OnePass" className="absolute bottom-0 left-0 w-[80%] -rotate-[3deg] overflow-hidden rounded-card bg-surface shadow-pop">
              <div className="flex items-center justify-between bg-ink px-5 py-4 text-white">
                <span className="flex items-center gap-2 text-[16px] font-semibold tracking-tight">
                  <LogoIcon className="size-6" blink={false} /> OnePass
                </span>
                <span className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-white/60">Sample</span>
              </div>
              <div className="px-5 pt-5">
                <p className="eyebrow">Valid for</p>
                <p className="mt-1 text-[19px] font-semibold tracking-tighter">Every event you join</p>
              </div>
              <div className="ticket-cut my-2" />
              <div className="flex items-end gap-4 px-5 pb-5">
                <div
                  className="w-[112px] shrink-0 rounded-xl bg-white p-2 ring-1 ring-line [&>svg]:size-full"
                  role="img"
                  aria-label="Sample QR code. Scanning it opens EvntCult sign-up."
                  dangerouslySetInnerHTML={{ __html: data.onePassQr }}
                />
                <ul className="flex-1 space-y-1.5 text-[12.5px] text-ink-2">
                  {["Registered", "Checked in", "Certificate", "Photos"].map((s) => (
                    <li key={s} className="flex items-center gap-1.5">
                      <Check className="size-3.5 text-live" aria-hidden /> {s}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* ── 2. Category ticker ─────────────────────────────── */}
      <div className="border-y border-line bg-surface py-5">
        <Marquee words={["Gaming nights", "Sports", "Hackathons", "Cultural fests", "Workshops", "Talks", "Parties"]} className="text-[22px] font-medium tracking-tighter text-ink-muted" />
        <p className="sr-only">Gaming nights, sports, hackathons, cultural fests, workshops, talks and parties.</p>
      </div>

      {/* ── 3. OnePass, step by step ───────────────────────── */}
      <section id="onepass" aria-labelledby="onepass-heading" className="px-gutter py-section">
        <div className="mx-auto grid max-w-shell gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <Reveal className="lg:sticky lg:top-28 lg:self-start">
            <SectionHeader
              id="onepass-heading"
              eyebrow="01 — Our flagship · OnePass"
              title={
                <>
                  Your identity <em>for</em> events.
                </>
              }
              sub="One dynamic pass that makes going to events effortless: check-in at the gate, live updates, all from a single tap. No paper tickets, no forms at the door, no hunting for photos later."
              size="lg"
            />
          </Reveal>

          <ol className="border-t border-line">
            {STEPS.map((s, i) => (
              <Reveal as="li" key={s.title} delay={i * 60} className="grid grid-cols-[48px_1fr] gap-4 border-b border-line py-7 md:grid-cols-[64px_1fr_auto] md:py-8">
                <span className="font-mono text-[13px] text-ink-subtle">0{i + 1}</span>
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 text-h3 font-semibold">
                    {s.title}
                  </p>
                  <p className="mt-2 max-w-prose text-body text-ink-muted">{s.body}</p>
                </div>
                <span className="hidden size-11 place-items-center rounded-tile bg-surface text-ink shadow-card md:grid" aria-hidden>
                  <s.icon className="size-5" />
                </span>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ── 4. What's on (preview) ─────────────────────────── */}
      {next && (
      <section aria-labelledby="preview-heading" className="px-gutter pb-section">
        <div className="mx-auto max-w-shell">
          <Reveal>
            <SectionHeader
              id="preview-heading"
              eyebrow="02 — A peek at your dashboard"
              title={
                <>
                  What&apos;s <em>on</em> this week.
                </>
              }
              size="lg"
              actions={
                <span className="rounded-full bg-surface px-3.5 py-1.5 text-[13px] text-ink-muted shadow-card">Preview · sign up to open events</span>
              }
            />
          </Reveal>

          <div className="mt-12 grid gap-4 lg:grid-cols-12">
            <Reveal className="lg:col-span-7">
              <PreviewLock label={next.title} className="h-full rounded-panel">
                <article className="relative isolate flex h-full min-h-[440px] flex-col justify-between overflow-hidden rounded-panel p-7 text-white md:p-9">
                  <EventArt accent={next.accent} />
                  <div className="relative flex flex-wrap gap-2">
                    <span className="rounded-full bg-white/95 px-2.5 py-1 text-[12px] font-medium text-ink">Next up</span>
                    <span className="rounded-full bg-black/25 px-2.5 py-1 text-[12px] font-medium backdrop-blur">{CATEGORY_LABEL[next.category] ?? "Event"}</span>
                  </div>
                  <div className="relative">
                    <p className="font-mono text-[12px] uppercase tracking-[0.08em] text-white/80">
                      {fmtDate(next.startsAt, { weekday: "long", day: "numeric", month: "long" })} · {fmtTime(next.startsAt)}
                    </p>
                    <h3 className="mt-3 text-display-md font-semibold">{next.title}</h3>
                    {next.venueName && (
                      <p className="mt-2 flex items-center gap-1.5 text-[14px] text-white/85">
                        <MapPin className="size-4" aria-hidden /> {next.venueName}
                      </p>
                    )}
                    <div className="mt-7 flex flex-wrap items-end justify-between gap-5">
                      <div className="rounded-tile bg-white/95 p-2 text-ink">
                        <Countdown to={next.startsAt} endsAt={next.endsAt} compact />
                      </div>
                      <span className="inline-flex h-11 items-center gap-2 rounded-full bg-white pl-5 pr-4 text-[14px] font-medium text-ink">
                        Book your seat · {next.feePaise > 0 ? formatINR(next.feePaise) : "Free"} <ArrowRight className="size-4" aria-hidden />
                      </span>
                    </div>
                  </div>
                </article>
              </PreviewLock>
            </Reveal>

            <ul className="flex flex-col gap-2 lg:col-span-5">
              {rest.slice(0, 5).map((e, i) => (
                <Reveal as="li" key={e.id} delay={i * 50}>
                  <PreviewLock label={e.title} className="rounded-card">
                    <div className="group flex items-center gap-4 rounded-card bg-surface p-3 pr-4 shadow-card transition-shadow duration-base ease-out hover:shadow-raised">
                      <div className="relative isolate grid h-14 w-12 shrink-0 place-items-center overflow-hidden rounded-xl text-white">
                        <EventArt accent={e.accent} />
                        <div className="relative text-center leading-none">
                          <div className="font-mono text-[9.5px] uppercase tracking-[0.08em]">{fmtDate(e.startsAt, { month: "short" })}</div>
                          <div className="mt-0.5 text-[18px] font-semibold tabular-nums">{fmtDate(e.startsAt, { day: "numeric" })}</div>
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-medium">{e.title}</p>
                        <p className="mt-0.5 truncate text-[12.5px] text-ink-muted">
                          {fmtDate(e.startsAt, { weekday: "short" })} · {fmtTime(e.startsAt)}
                          {e.venueName ? ` · ${e.venueName}` : ""}
                        </p>
                      </div>
                      <ArrowUpRight className="size-4 shrink-0 text-ink-subtle transition-transform duration-base ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink" aria-hidden />
                    </div>
                  </PreviewLock>
                </Reveal>
              ))}
            </ul>
          </div>
        </div>
      </section>
      )}

      {/* ── 5. For organizers ──────────────────────────────── */}
      <section aria-labelledby="org-heading" className="border-y border-line bg-surface px-gutter py-section">
        <div className="mx-auto max-w-shell">
          <Reveal>
            <SectionHeader
              id="org-heading"
              eyebrow="03 — For organizers"
              title={
                <>
                  Run the gate, not <em>spreadsheets.</em>
                </>
              }
              sub="Everything a club needs on the night: registrations, payments at the desk, a scanner that works offline and a live headcount."
              size="lg"
            />
          </Reveal>
          <div className="mt-12 grid gap-px overflow-hidden rounded-card bg-line shadow-card sm:grid-cols-2 lg:grid-cols-5">
            {ORGANIZER_FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={i * 50} className="flex flex-col bg-surface p-6">
                <span className="grid size-10 place-items-center rounded-tile bg-sunken text-ink" aria-hidden>
                  <f.icon className="size-[18px]" />
                </span>
                <p className="mt-10 text-h4 font-semibold">{f.title}</p>
                <p className="mt-1.5 text-small text-ink-muted">{f.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. Closing call to action ──────────────────────── */}
      <section className="px-gutter py-section">
        <Reveal className="mx-auto flex max-w-shell flex-col items-start justify-between gap-10 md:flex-row md:items-end">
          <h2 className="max-w-3xl text-display-xl font-semibold">
            Get your <em>OnePass.</em>
            <span className="block text-ink-subtle">It takes one email.</span>
          </h2>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <LinkButton href="/signin?mode=signup" variant="accent" size="lg">
              Sign up free <ArrowRight className="size-4" aria-hidden />
            </LinkButton>
            <LinkButton href="/signin" variant="secondary" size="lg">
              Log in
            </LinkButton>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
