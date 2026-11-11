import Link from "next/link";
import { ArrowRight, BellRing, CalendarCheck2, Camera, Check, LayoutGrid, MapPin, Radio, ScanLine, ShieldCheck, Ticket } from "lucide-react";
import type { EventSummary } from "@/lib/data/types";
import { Aurora } from "@/components/brand/Aurora";
import { RotatingBadge } from "@/components/brand/RotatingBadge";
import { LogoWordmark } from "@/components/brand/MissingE";
import { EventArt } from "@/components/ui/EventArt";
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

/* Where the preview tickets float around the hero headline (laptops only). */
const FLOAT_SPOTS = [
  { className: "left-[3%] top-[12%]", tilt: "-8deg", delay: "0s" },
  { className: "right-[4%] top-[9%]", tilt: "7deg", delay: "-2s" },
  { className: "left-[5%] bottom-[11%]", tilt: "5deg", delay: "-4s" },
];

function PreviewTicket({ e, spot }: { e: EventSummary; spot: (typeof FLOAT_SPOTS)[number] }) {
  return (
    <PreviewLock
      label={e.title}
      className={`absolute hidden w-[172px] rounded-md lg:block ${spot.className}`}
    >
      <div style={{ ["--tilt" as string]: spot.tilt, animationDelay: spot.delay, transform: `rotate(${spot.tilt})` }} className="overflow-hidden rounded-md border border-white/15 bg-surface/80 transition-transform duration-large hover:scale-105">
        <div className="relative h-[86px]">
          <EventArt accent={e.accent} />
          <span className="absolute left-2 top-2 rounded-full bg-black/55 px-2 py-1 text-caption font-semibold uppercase tracking-[0.08em] text-white">
            {fmtDate(e.startsAt, { day: "numeric", month: "short" })}
          </span>
        </div>
        <div className="px-3 py-3">
          <p className="line-clamp-1 text-body-sm font-semibold">{e.title}</p>
          <p className="text-caption text-ink-muted">{fmtTime(e.startsAt)}</p>
        </div>
      </div>
    </PreviewLock>
  );
}

const ONEPASS_STEPS = [
  { icon: Ticket, title: "Register in a tap", body: "Pick an event, tap Register and your OnePass is ready instantly. Full? Join the waitlist and we hold a seat for you when one opens." },
  { icon: ScanLine, title: "Fast-track entry", body: "Show the QR at the gate and you're in. Organizers scan it in a second, even when the Wi-Fi drops." },
  { icon: BellRing, title: "Always up to date", body: "Time or venue changed? Updates from the organizer show up right on your dashboard." },
  { icon: Camera, title: "Relive it after", body: "Your certificate of attendance appears the moment you're scanned in, and you can save the event photos you're in." },
];

/** What a signed-out visitor sees. Event cards are a preview of the dashboard: they never open an event. */
export function PublicHome({ data }: { data: PublicHomeData }) {
  const events = data.campus;
  const [next, ...rest] = events;

  return (
    <div className="space-y-24 pb-8 md:space-y-32">
      {/* ── 1. Hero ────────────────────────────────────── */}
      <section className="relative isolate mt-3 flex min-h-[620px] flex-col items-center justify-center overflow-hidden rounded-lg px-6 py-24 text-center md:min-h-[84vh] md:rounded-lg">
        <Aurora />
        <div aria-hidden className="absolute left-1/2 top-[18%] -z-10 size-[520px] -translate-x-1/2 rounded-full bg-volt/[0.07] blur-[120px]" />
        {events.slice(0, FLOAT_SPOTS.length).map((e, i) => (
          <PreviewTicket key={e.id} e={e} spot={FLOAT_SPOTS[i]} />
        ))}

        <div className="relative max-w-4xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-body-sm font-semibold text-ink-2">
            Welcome to <LogoWordmark className="text-title text-ink" motion="blink" />
          </span>
          <h1 className="mt-8 font-display font-semibold leading-none">
            <span className="block text-display text-ink">Every event.</span>{" "}
            <span className="block text-display text-volt">One place.</span>
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-title leading-relaxed text-ink-2">
            EvntCult brings every fest, game night and workshop together. Your calendar fills itself, organizers&apos; updates reach you live,
            clash detection keeps events from colliding, and <span className="font-semibold text-ink">OnePass</span> gets you in with one tap.
          </p>
          <ul className="mx-auto mt-8 flex max-w-3xl flex-wrap justify-center gap-2" aria-label="What EvntCult does">
            {[
              { icon: LayoutGrid, label: "All events, one place" },
              { icon: CalendarCheck2, label: "Calendar that fills itself" },
              { icon: Radio, label: "Live updates" },
              { icon: ShieldCheck, label: "Clash detection" },
              { icon: Ticket, label: "OnePass entry" },
            ].map((f) => (
              <li key={f.label} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-body-sm font-semibold text-ink-2">
                <f.icon className="size-4 text-volt" aria-hidden /> {f.label}
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/signin?mode=signup"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-volt px-8 py-4 text-body font-semibold text-ink-inverse transition-colors hover:bg-volt-hover sm:w-auto"
            >
              Sign up free <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link
              href="/signin"
              className="inline-flex w-full items-center justify-center rounded-full border border-white/20 px-8 py-4 text-body font-semibold text-ink transition-colors hover:border-volt/60 sm:w-auto"
            >
              Log in
            </Link>
            <Link
              href={`/signin?next=${encodeURIComponent("/organizer/events/new")}`}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-4 text-body font-semibold text-ink-2 transition-colors hover:text-volt sm:w-auto"
            >
              Host an event <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </div>

        <div className="absolute bottom-8 right-8 hidden md:block">
          <RotatingBadge href="/signin?mode=signup" label="Sign up for EvntCult" text="JOIN EVNTCULT • SIGN UP • " />
        </div>
      </section>

      {/* ── 2. OnePass ─────────────────────────────────── */}
      <section aria-labelledby="onepass-heading" className="grid items-start gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        <div>
          <p className="eyebrow">Our flagship · your identity for events</p>
          <h2 id="onepass-heading" className="mt-3 font-display text-display font-semibold leading-none">
            One<span className="text-volt">Pass</span>
          </h2>
          <p className="mt-6 max-w-xl text-title leading-relaxed text-ink-2">
            One dynamic pass that makes going to events effortless: check-in at the gate, live updates, all from a single tap. No paper tickets, no forms at the door, no hunting for photos later.
          </p>

          <ol className="mt-12 space-y-3">
            {ONEPASS_STEPS.map((s, i) => (
              <li key={s.title} className="card flex gap-4 p-6">
                <span className="grid size-11 shrink-0 place-items-center rounded-md bg-volt/10 text-volt" aria-hidden>
                  <s.icon className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 text-body font-semibold">
                    <span className="font-mono text-label text-ink-subtle">0{i + 1}</span> {s.title}
                  </p>
                  <p className="mt-1 text-body text-ink-muted">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* The pass itself, as a sample (its QR opens sign-up). */}
        <div className="relative mx-auto w-full max-w-[400px] lg:sticky lg:top-28">
          <div aria-hidden className="absolute inset-x-6 top-10 -z-10 h-full rounded-lg bg-volt/20 blur-[80px]" />
          <article aria-label="Sample OnePass" className="overflow-hidden rounded-lg border border-white/10 bg-surface">
            <div className="bg-volt p-6 text-ink-inverse">
              <div className="flex items-center justify-between">
                <span className="font-display text-heading font-semibold leading-none">OnePass</span>
                <span className="rounded-full bg-ink-inverse/10 px-3 py-1 text-caption font-semibold uppercase tracking-[0.08em]">Sample</span>
              </div>
              <p className="mt-6 text-label font-semibold uppercase tracking-[0.12em] opacity-70">Valid for</p>
              <p className="font-display text-display font-semibold leading-tight">Every event you join</p>
            </div>
            <div className="ticket-cut" />
            <div className="flex flex-col items-center px-6 pb-6">
              <div className="w-[200px] rounded-md bg-white p-3 [&>svg]:size-full" role="img" aria-label="Sample QR code. Scanning it opens EvntCult sign-up." dangerouslySetInnerHTML={{ __html: data.onePassQr }} />
              <p className="mt-3 text-label text-ink-muted">Scan to sign up</p>
              <ul className="mt-6 grid w-full grid-cols-2 gap-2 text-label font-semibold">
                {["Registered", "Checked in", "Certificate", "Photos"].map((s) => (
                  <li key={s} className="flex items-center gap-2 rounded-md border border-white/[0.06] bg-white/[0.03] px-3 py-3">
                    <Check className="size-4 shrink-0 text-volt" aria-hidden /> {s}
                  </li>
                ))}
              </ul>
            </div>
          </article>
        </div>
      </section>

      {/* ── 3. Live numbers (real counts) ──────────────── */}
      <section className="relative isolate mx-auto max-w-4xl overflow-hidden rounded-full px-4 py-8 md:py-12" aria-label="Numbers">
        <div aria-hidden className="absolute inset-0 -z-10 bg-volt" />
        <div className="grid grid-cols-3 divide-x divide-ink-inverse/15">
          {[
            { v: data.thisWeek, l: "Events this week" },
            { v: data.upcoming, l: "Upcoming events" },
            { v: data.going, l: "People going" },
          ].map((s) => (
            <div key={s.l} className="px-4 text-center">
              <p className="font-display text-display font-semibold leading-none text-ink-inverse">{s.v.toLocaleString("en-IN")}</p>
              <p className="mt-2 text-body-sm font-semibold text-ink-inverse/75">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 4. Dashboard preview (look, don't open) ────── */}
      {next && (
      <section aria-labelledby="preview-heading">
        <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">A peek at your dashboard</p>
            <h2 id="preview-heading" className="shout mt-3 text-display">
              What&apos;s <span className="text-volt">on</span>
            </h2>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-body-sm font-semibold text-ink-muted">
            Preview · sign up to open events
          </span>
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          <PreviewLock label={next.title} className="rounded-lg lg:col-span-7">
            <article className="card relative h-full overflow-hidden p-6 transition-colors hover:border-volt/40 md:p-8">
              <div aria-hidden className="absolute -right-24 -top-24 size-72 rounded-full bg-volt/10 blur-3xl" />
              <p className="relative text-label font-semibold uppercase tracking-[0.12em] text-volt">Next up</p>
              <h3 className="shout relative mt-3 text-display">{next.title}</h3>
              <p className="relative mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-body text-ink-2">
                <span>
                  {fmtDate(next.startsAt, { weekday: "short", day: "numeric", month: "short" })} · {fmtTime(next.startsAt)}
                </span>
                {next.venueName && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="size-3.5 text-ink-subtle" aria-hidden /> {next.venueName}
                  </span>
                )}
              </p>
              <div className="relative mt-8">
                <Countdown to={next.startsAt} endsAt={next.endsAt} />
              </div>
              <div className="relative mt-8 flex items-center justify-between gap-3 rounded-full bg-volt py-4 pl-6 pr-3 text-body font-semibold text-ink-inverse">
                <span>Book your seat · {next.feePaise > 0 ? formatINR(next.feePaise) : "Free"}</span>
                <ArrowRight className="size-5" aria-hidden />
              </div>
            </article>
          </PreviewLock>

          <ul className="space-y-3 rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 md:p-6 lg:col-span-5">
            {rest.slice(0, 5).map((e) => (
              <li key={e.id}>
                <PreviewLock label={e.title} className="rounded-full">
                  <div className="flex items-center gap-4 rounded-full border border-white/[0.08] bg-surface py-3 pl-6 pr-3 transition-colors hover:border-volt/40">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-body font-semibold">{e.title}</p>
                      <p className="text-label text-ink-muted">
                        {fmtDate(e.startsAt, { weekday: "short", day: "numeric", month: "short" })} · {fmtTime(e.startsAt)}
                      </p>
                    </div>
                    {e.venueName && (
                      <span className="hidden max-w-[130px] items-center gap-2 truncate text-label text-ink-muted sm:flex">
                        <MapPin className="size-3.5 shrink-0" aria-hidden /> <span className="truncate">{e.venueName}</span>
                      </span>
                    )}
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white/[0.06] text-ink-muted" aria-hidden>
                      <ArrowRight className="size-4" />
                    </span>
                  </div>
                </PreviewLock>
              </li>
            ))}
          </ul>
        </div>
      </section>
      )}

      {/* ── 5. Closing call to action ──────────────────── */}
      <section className="flex flex-col items-start justify-between gap-6 rounded-lg border border-white/[0.08] bg-surface p-8 md:flex-row md:items-end md:p-12">
        <h2 className="title-xl max-w-3xl text-display">
          Never miss what&apos;s happening. <em>Join EvntCult today.</em>
        </h2>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Link href="/signin?mode=signup" className="inline-flex items-center justify-center gap-2 rounded-full bg-volt px-8 py-4 text-body font-semibold text-ink-inverse hover:bg-volt-hover">
            Get started <ArrowRight className="size-4" aria-hidden />
          </Link>
          <Link href="/signin" className="inline-flex items-center justify-center rounded-full border border-white/20 px-8 py-4 text-body font-semibold hover:border-volt/60">
            Log in
          </Link>
          <Link href="/get-app" className="inline-flex items-center justify-center rounded-full border border-white/20 px-8 py-4 text-body font-semibold hover:border-volt/60">Get the app</Link>
        </div>
      </section>
    </div>
  );
}
