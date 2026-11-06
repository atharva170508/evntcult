import Link from "next/link";
import { ArrowRight, ArrowUpRight, MapPin, QrCode, ScanLine, Ticket } from "lucide-react";
import type { EventSummary } from "@/lib/data/types";
import { Aurora } from "@/components/brand/Aurora";
import { Marquee } from "@/components/brand/Marquee";
import { RotatingBadge } from "@/components/brand/RotatingBadge";
import { EventArt } from "@/components/ui/EventArt";
import { EmptyState } from "@/components/ui/EmptyState";
import { Countdown } from "@/components/dashboard/Countdown";
import { formatINR } from "@/lib/money";
import { fmtDate, fmtTime } from "@/lib/utils";

export interface PublicHomeData {
  campus: EventSummary[];
  thisWeek: number;
  upcoming: number;
  going: number;
  /** SVG QR code that opens the next event's page. */
  nextQr: string | null;
}

/* Where the floating event tickets sit around the hero headline (desktop only). */
const FLOAT_SPOTS = [
  { className: "left-[4%] top-[14%]", tilt: "-8deg", delay: "0s" },
  { className: "right-[5%] top-[10%]", tilt: "7deg", delay: "-2s" },
  { className: "left-[4%] bottom-[10%]", tilt: "5deg", delay: "-4s" },
  { className: "right-[15%] bottom-[7%]", tilt: "-6deg", delay: "-1s" },
];

function FloatingTicket({ e, spot }: { e: EventSummary; spot: (typeof FLOAT_SPOTS)[number] }) {
  return (
    <Link
      href={`/events/${e.slug}`}
      className={`group absolute hidden w-[176px] motion-safe:animate-drift lg:block ${spot.className}`}
      style={{ ["--tilt" as string]: spot.tilt, animationDelay: spot.delay, transform: `rotate(${spot.tilt})` }}
    >
      <div className="overflow-hidden rounded-2xl border border-white/20 bg-black/30 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.7)] backdrop-blur-md transition-transform duration-500 group-hover:scale-105">
        <div className="relative h-[96px]">
          <EventArt accent={e.accent} />
          <span className="absolute left-2 top-2 rounded-full bg-black/45 px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wider text-white backdrop-blur">
            {fmtDate(e.startsAt, { day: "numeric", month: "short" })}
          </span>
        </div>
        <div className="px-3 py-2.5 text-white">
          <p className="line-clamp-1 text-[13px] font-bold">{e.title}</p>
          <p className="text-[11px] text-white/70">{fmtTime(e.startsAt)}</p>
        </div>
      </div>
    </Link>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="px-4 text-center">
      <p className="font-serif text-[clamp(40px,5vw,64px)] leading-none text-white">{value.toLocaleString("en-IN")}</p>
      <p className="mt-2 text-[13px] font-semibold text-white/80">{label}</p>
    </div>
  );
}

/** What a signed-out visitor sees: a cinematic landing page built only from real campus data. */
export function PublicHome({ data }: { data: PublicHomeData }) {
  const [next, ...rest] = data.campus;
  const floaters = data.campus.slice(0, FLOAT_SPOTS.length);

  return (
    <div className="space-y-24 pb-8 md:space-y-32">
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative isolate mt-3 flex min-h-[640px] flex-col items-center justify-center overflow-hidden rounded-[36px] px-5 py-20 text-center text-white md:min-h-[86vh] md:rounded-[44px]">
        <Aurora />
        <Marquee words={["Register", "Get your pass", "Walk in", "Relive it"]} className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-[clamp(72px,13vw,190px)] text-white/[0.07]" />
        {floaters.map((e, i) => (
          <FloatingTicket key={e.id} e={e} spot={FLOAT_SPOTS[i]} />
        ))}

        <div className="relative max-w-4xl">
          <span className="glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[12px] font-bold uppercase tracking-[0.16em]">
            <span className="size-1.5 rounded-full bg-volt motion-safe:animate-pulse-dot" aria-hidden /> Campus events · KKW
          </span>
          <h1 className="mt-6 font-serif text-[clamp(52px,8.6vw,128px)] leading-[0.92] tracking-[-0.025em]">
            Every campus night, one <em className="text-volt">pass</em> away.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-[17px] leading-relaxed text-white/85">
            Browse every fest, game night and workshop on campus. Sign up with your college email to register and get a QR pass.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link href="/signin?mode=signup" className="inline-flex items-center gap-2 rounded-full bg-volt px-6 py-3.5 text-[15px] font-bold text-ink-inverse transition-colors hover:bg-volt-hover">
              Sign up free <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link href="/signin" className="glass rounded-full px-6 py-3.5 text-[15px] font-semibold transition-colors hover:bg-white/15">
              Log in
            </Link>
            <Link href="/events" className="rounded-full px-4 py-3.5 text-[15px] font-semibold text-white/90 underline-offset-4 hover:underline">
              Browse events →
            </Link>
          </div>
        </div>

        <div className="absolute bottom-8 right-8 hidden md:block">
          <RotatingBadge href="/signin?mode=signup" label="Sign up and get your pass" />
        </div>
      </section>

      {/* ── Statement ────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl text-center">
        <p className="eyebrow">How it works on campus</p>
        <p className="title-serif mt-5 text-[clamp(32px,4.6vw,62px)] leading-[1.06]">
          One place for every fest and game night. Register in a tap, carry{" "}
          <span className="inline-flex translate-y-[-0.08em] items-center gap-2 rounded-full bg-gradient-to-r from-aurora-1 to-aurora-2 px-4 align-middle font-sans text-[0.42em] font-bold text-white">
            <QrCode className="size-[1em]" aria-hidden /> one QR pass
          </span>{" "}
          and walk <em className="text-aurora">straight in.</em>
        </p>
      </section>

      {/* ── Live numbers (all real counts) ───────────────── */}
      <section className="relative isolate mx-auto max-w-4xl overflow-hidden rounded-full px-4 py-9 md:py-11" aria-label="Campus numbers">
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-[#8a63ff] via-[#5b6dff] to-[#7c4dff]" />
        <div aria-hidden className="absolute inset-0 -z-10 opacity-60 blur-2xl" style={{ background: "radial-gradient(50% 120% at 50% 0%, rgba(255,255,255,0.35), transparent 70%)" }} />
        <div className="grid grid-cols-3 divide-x divide-white/20">
          <Stat value={data.thisWeek} label="Events this week" />
          <Stat value={data.upcoming} label="Upcoming events" />
          <Stat value={data.going} label="Students going" />
        </div>
      </section>

      {/* ── Next up + the line-up ────────────────────────── */}
      <section>
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Happening on campus</p>
            <h2 className="shout mt-3 text-[clamp(34px,5.2vw,72px)]">
              Book <span className="text-aurora">&</span> explore
              <br />
              upcoming <ArrowRight className="inline size-[0.8em] text-volt" aria-hidden /> events
            </h2>
          </div>
          <Link href="/events" className="glass inline-flex items-center gap-1.5 rounded-full px-5 py-3 text-[14px] font-semibold hover:bg-white/15">
            Browse all <ArrowUpRight className="size-4" aria-hidden />
          </Link>
        </div>

        {!next ? (
          <EmptyState icon={Ticket} title="No upcoming events on campus" body="When organizers publish events, they show up here." />
        ) : (
          <div className="grid gap-5 lg:grid-cols-12">
            {/* Bento: next event with countdown, QR and a volt booking bar (EventX idea). */}
            <article className="card relative overflow-hidden p-6 md:p-8 lg:col-span-7">
              <div aria-hidden className="absolute -right-24 -top-24 size-72 rounded-full bg-aurora-1/30 blur-3xl" />
              <div className="relative flex flex-wrap items-start justify-between gap-5">
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-volt">Next up</p>
                  <h3 className="shout mt-3 text-[clamp(26px,3.4vw,44px)]">{next.title}</h3>
                  <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px] text-ink-2">
                    <span>
                      {fmtDate(next.startsAt, { weekday: "short", day: "numeric", month: "short" })} · {fmtTime(next.startsAt)}
                    </span>
                    {next.venueName && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="size-3.5 text-ink-subtle" aria-hidden /> {next.venueName}
                      </span>
                    )}
                  </p>
                </div>
                {data.nextQr && (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-[104px] rounded-2xl bg-white p-2.5 [&>svg]:size-full" role="img" aria-label={`QR code that opens ${next.title}`} dangerouslySetInnerHTML={{ __html: data.nextQr }} />
                    <span className="rounded-full bg-volt/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-volt">Scan to open</span>
                  </div>
                )}
              </div>
              <div className="relative mt-8">
                <Countdown to={next.startsAt} endsAt={next.endsAt} />
              </div>
              <Link
                href={`/events/${next.slug}`}
                className="relative mt-8 flex items-center justify-between gap-3 rounded-full bg-volt py-2 pl-6 pr-2 text-[15px] font-bold text-ink-inverse transition-colors hover:bg-volt-hover"
              >
                <span>
                  Book your seat · {next.feePaise > 0 ? formatINR(next.feePaise) : "Free"}
                </span>
                <span className="grid size-11 place-items-center rounded-full bg-aurora-1 text-white" aria-hidden>
                  <ArrowUpRight className="size-5" />
                </span>
              </Link>
            </article>

            {/* The rest of the line-up as black pills on a purple glow (Hosteve idea). */}
            <div className="relative isolate overflow-hidden rounded-[28px] p-5 md:p-6 lg:col-span-5">
              <Aurora quiet />
              <ul className="relative space-y-2.5">
                {rest.length === 0 && <li className="rounded-full bg-black/60 px-6 py-4 text-[14px] text-ink-muted">More events will appear here soon.</li>}
                {rest.slice(0, 6).map((e) => (
                  <li key={e.id}>
                    <Link
                      href={`/events/${e.slug}`}
                      className="group flex items-center gap-4 rounded-full border border-white/[0.08] bg-black/70 py-3 pl-6 pr-3 backdrop-blur transition-colors hover:border-white/25"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-semibold text-white">{e.title}</p>
                        <p className="text-[12px] text-ink-muted">
                          {fmtDate(e.startsAt, { weekday: "short", day: "numeric", month: "short" })} · {fmtTime(e.startsAt)}
                        </p>
                      </div>
                      {e.venueName && (
                        <span className="hidden max-w-[120px] items-center gap-1.5 truncate text-[12px] text-ink-muted sm:flex">
                          <MapPin className="size-3.5 shrink-0" aria-hidden /> <span className="truncate">{e.venueName}</span>
                        </span>
                      )}
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white/10 text-white transition-transform group-hover:rotate-45" aria-hidden>
                        <ArrowUpRight className="size-4" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </section>

      {/* ── Three steps ──────────────────────────────────── */}
      <section className="grid gap-4 md:grid-cols-3">
        {[
          { n: "01", icon: Ticket, title: "Register", body: "Pick an event and tap Register. Full? Join the waitlist and we hold a seat for you when one opens." },
          { n: "02", icon: QrCode, title: "Get your pass", body: "Your QR pass lives in My passes, ready for the gate. Add it to your calendar in one tap." },
          { n: "03", icon: ScanLine, title: "Walk in", body: "Show the QR at the gate. Organizers scan it, even when the campus Wi-Fi drops." },
        ].map((s) => (
          <article key={s.n} className="card p-7">
            <div className="flex items-center justify-between">
              <span className="shout text-aurora text-[44px]">{s.n}</span>
              <s.icon className="size-6 text-ink-muted" aria-hidden />
            </div>
            <h3 className="title-serif mt-8 text-[34px]">{s.title}</h3>
            <p className="mt-2 text-[14.5px] text-ink-muted">{s.body}</p>
          </article>
        ))}
      </section>

      {/* ── Closing CTA + giant wordmark ─────────────────── */}
      <section className="space-y-14 pt-4">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <h2 className="title-serif max-w-2xl text-[clamp(40px,5.6vw,80px)]">
            Ready for your <em className="text-volt">next</em> night out?
          </h2>
          <Link href="/signin?mode=signup" className="inline-flex items-center gap-2 rounded-full bg-volt px-7 py-4 text-[16px] font-bold text-ink-inverse hover:bg-volt-hover">
            Create your account <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </section>
    </div>
  );
}
