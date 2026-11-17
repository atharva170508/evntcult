import Link from "next/link";
import {
  ArrowRight,
  Award,
  BellRing,
  Cpu,
  Drama,
  Gamepad2,
  Images,
  IndianRupee,
  Mic,
  PartyPopper,
  ScanLine,
  Trophy,
  WifiOff,
  Wrench,
  CalendarPlus,
  type LucideIcon,
} from "lucide-react";
import { BoardingPass } from "./BoardingPass";

/* ── Kinds ───────────────────────────────────────────────── */

const KINDS: { key: string; label: string; icon: LucideIcon }[] = [
  { key: "TECH", label: "Tech", icon: Cpu },
  { key: "CULTURAL", label: "Cultural", icon: Drama },
  { key: "SPORTS", label: "Sports", icon: Trophy },
  { key: "GAMING", label: "Gaming", icon: Gamepad2 },
  { key: "WORKSHOP", label: "Workshops", icon: Wrench },
  { key: "TALK", label: "Talks", icon: Mic },
  { key: "PARTY", label: "Parties", icon: PartyPopper },
];

export function KindRail() {
  return (
    <nav aria-label="Browse by kind" className="no-scrollbar -mx-gutter flex gap-1 overflow-x-auto px-gutter sm:mx-0 sm:justify-between sm:px-0">
      {KINDS.map((k) => (
        <Link
          key={k.key}
          href={`/events?type=${k.key}`}
          className="group flex min-w-[88px] shrink-0 flex-col items-center gap-2 rounded-2xl px-3 py-3 text-[13.5px] font-semibold text-ink-muted transition-colors duration-fast hover:bg-sunken hover:text-ink"
        >
          <k.icon className="size-6 transition-transform duration-base ease-out group-hover:-translate-y-0.5" strokeWidth={1.6} aria-hidden />
          {k.label}
        </Link>
      ))}
    </nav>
  );
}

/* ── The pass, cinematic band ─────────────────────────────── */

export function PassBand({ qr }: { qr: string }) {
  const facts = [
    { icon: WifiOff, t: "Works without signal", b: "Saved passes open in airplane mode, right at the gate." },
    { icon: CalendarPlus, t: "Already in your calendar", b: "One tap adds the time and venue, with directions." },
    { icon: Award, t: "Keeps the memories", b: "Photos you're tagged in and your certificate land on the same account." },
  ];
  return (
    <section id="onepass" aria-labelledby="pass-h" className="bleed relative overflow-hidden bg-night text-white">
      <div className="mx-auto grid max-w-shell items-center gap-14 px-gutter py-section lg:grid-cols-[1fr_440px] lg:gap-20">
        <div>
          <p className="text-[14px] font-semibold text-gold">OnePass</p>
          <h2 id="pass-h" className="mt-4 max-w-[14ch] text-display-xl font-medium text-white">
            One pass for every gate on campus.
          </h2>
          <p className="mt-6 max-w-[46ch] text-lead text-white/65">
            Register once and your pass is ready. Show it at the door, get scanned, walk in. No printouts, no queue at a desk, no lost forwarded PDFs.
          </p>
          <ul className="mt-12 grid gap-8 sm:grid-cols-3 lg:max-w-none">
            {facts.map((f) => (
              <li key={f.t} className="border-t border-white/15 pt-5">
                <f.icon className="size-5 text-gold" aria-hidden />
                <p className="mt-4 text-[15.5px] font-semibold">{f.t}</p>
                <p className="mt-1.5 text-[14px] leading-relaxed text-white/55">{f.b}</p>
              </li>
            ))}
          </ul>
        </div>
        <BoardingPass qr={qr} className="mx-auto w-full max-w-[440px] rotate-[-2.5deg] transition-transform duration-slow ease-out hover:rotate-0 motion-reduce:rotate-0" />
      </div>
    </section>
  );
}

/* ── How an evening goes ──────────────────────────────────── */

const EVENING = [
  { at: "6:40 pm", t: "You find it", b: "Hoops Night is on the board for tonight. Two taps and you're in." },
  { at: "6:41 pm", t: "Your pass is ready", b: "It's on your phone and in your calendar. Paid events take UPI." },
  { at: "8:02 pm", t: "Scanned at the gate", b: "The organizer's phone beeps green. Even if the Wi‑Fi doesn't." },
  { at: "Next day", t: "It's all still there", b: "Find yourself in the photos, download your certificate." },
];

export function Evening() {
  return (
    <section id="how" aria-labelledby="how-h" className="scroll-mt-28">
      <div className="max-w-2xl">
        <p className="text-[14px] font-semibold text-accent-ink">How it works</p>
        <h2 id="how-h" className="mt-3 text-display-lg font-medium">
          One evening, start to finish.
        </h2>
      </div>
      <ol className="relative mt-14 grid gap-10 md:grid-cols-4 md:gap-8">
        <span aria-hidden className="absolute left-[7px] top-2 bottom-2 w-px bg-line-strong md:left-0 md:right-0 md:top-[7px] md:bottom-auto md:h-px md:w-auto" />
        {EVENING.map((s, i) => (
          <li key={s.at} className="relative pl-9 md:pl-0 md:pt-10">
            <span
              aria-hidden
              className={
                i === 2
                  ? "absolute left-0 top-1 size-[15px] rounded-full bg-accent ring-4 ring-accent-soft md:top-0"
                  : "absolute left-0 top-1 size-[15px] rounded-full border-[3px] border-white bg-night ring-1 ring-line-strong md:top-0"
              }
            />
            <p className="font-mono text-[13px] font-medium text-ink-subtle">{s.at}</p>
            <p className="mt-2 text-[19px] font-semibold tracking-[-0.01em]">{s.t}</p>
            <p className="mt-2 text-[15px] leading-relaxed text-ink-muted">{s.b}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ── For organizers ───────────────────────────────────────── */

export function Hosts({ signedIn }: { signedIn: boolean }) {
  const points = [
    { icon: IndianRupee, t: "Free or paid", b: "Collect by UPI and confirm payments from one list." },
    { icon: ScanLine, t: "Gate scanner", b: "Any phone becomes the door. Keeps working offline." },
    { icon: BellRing, t: "Tell everyone at once", b: "Time or venue changed? Post it; it reaches every pass." },
    { icon: Images, t: "After the night", b: "Upload photos, issue certificates, export the list." },
  ];
  const next = signedIn ? "/organizer/events/new" : `/signin?next=${encodeURIComponent("/organizer/events/new")}`;
  return (
    <section id="hosts" aria-labelledby="hosts-h" className="scroll-mt-28">
      <div className="grid items-center gap-14 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
        <div>
          <p className="text-[14px] font-semibold text-accent-ink">For organizers</p>
          <h2 id="hosts-h" className="mt-3 max-w-[16ch] text-display-lg font-medium">
            Run the whole night from one screen.
          </h2>
          <p className="mt-5 max-w-[48ch] text-lead text-ink-muted">Clubs, committees and fest teams set up an event in a few minutes. Registrations, the door and the follow-up all live in one place.</p>
          <ul className="mt-10 grid gap-x-8 gap-y-7 sm:grid-cols-2">
            {points.map((p) => (
              <li key={p.t} className="flex gap-3.5">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-sunken text-ink">
                  <p.icon className="size-[18px]" aria-hidden />
                </span>
                <span>
                  <span className="block text-[15.5px] font-semibold">{p.t}</span>
                  <span className="mt-0.5 block text-[14px] leading-relaxed text-ink-muted">{p.b}</span>
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link href={next} className="inline-flex h-12 items-center gap-2 rounded-xl bg-night px-6 text-[15px] font-semibold text-white shadow-button transition-colors hover:bg-night-3">
              Host an event <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </div>
        <HostPreview />
      </div>
    </section>
  );
}

/** An illustration of the organizer's live view, clearly marked as an example. */
function HostPreview() {
  const scans = [
    ["8:04", "Ishaan K.", "Admitted"],
    ["8:03", "Meera P.", "Admitted"],
    ["8:03", "Rohan D.", "Already in"],
    ["8:02", "Sana Q.", "Admitted"],
  ];
  return (
    <figure className="relative" aria-label="Example of the organizer's live view">
      <div className="rounded-[26px] bg-sunken p-3 sm:p-4">
        <div className="overflow-hidden rounded-[18px] bg-white shadow-[0_0_0_1px_#E5E7EB,0_20px_50px_-24px_rgba(11,22,38,0.3)]">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <div>
              <p className="text-[15px] font-semibold">Hoops Night</p>
              <p className="text-[12.5px] text-ink-subtle">Sports Complex · 7:00 pm</p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-md bg-live-soft px-2 py-1 text-[12px] font-semibold text-live">
              <span className="size-1.5 rounded-full bg-live-dot" aria-hidden /> Live
            </span>
          </div>
          <div className="grid grid-cols-3 divide-x divide-line border-b border-line">
            {[
              ["Checked in", "131", "of 184"],
              ["Registered", "184", "of 200"],
              ["Paid", "₹0", "free entry"],
            ].map(([k, v, s]) => (
              <div key={k} className="px-5 py-4">
                <p className="text-[12px] font-medium text-ink-subtle">{k}</p>
                <p className="mt-1 font-display text-[28px] font-semibold leading-none tracking-[-0.02em]">{v}</p>
                <p className="mt-1 text-[12px] text-ink-subtle">{s}</p>
              </div>
            ))}
          </div>
          <div className="px-5 pb-2 pt-4">
            <div className="h-2 overflow-hidden rounded-full bg-sunken">
              <div className="h-full w-[71%] rounded-full bg-night" />
            </div>
            <p className="mt-4 text-[12px] font-semibold text-ink-subtle">At the gate</p>
          </div>
          <ul className="px-2 pb-3">
            {scans.map(([t, n, s]) => (
              <li key={n} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px]">
                <span className="w-10 font-mono text-[12.5px] text-ink-subtle">{t}</span>
                <span className="flex-1 font-medium">{n}</span>
                <span className={s === "Admitted" ? "text-[12.5px] font-semibold text-live" : "text-[12.5px] font-semibold text-warn"}>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <figcaption className="mt-3 text-center text-[12.5px] text-ink-subtle">Example of the live view on an organizer&apos;s phone</figcaption>
    </figure>
  );
}

/* ── Closing ──────────────────────────────────────────────── */

export function Closing({ signedIn }: { signedIn: boolean }) {
  return (
    <section aria-labelledby="close-h" className="relative overflow-hidden rounded-[28px] bg-accent px-7 py-16 text-white sm:px-14 sm:py-20">
      <svg aria-hidden viewBox="0 0 400 400" className="pointer-events-none absolute -right-24 -top-24 size-[420px] text-white/[0.09]">
        <circle cx="200" cy="200" r="120" fill="currentColor" />
        <circle cx="200" cy="200" r="170" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="200" cy="200" r="198" fill="none" stroke="currentColor" strokeWidth="1" />
      </svg>
      <div className="relative max-w-2xl">
        <h2 id="close-h" className="text-display-lg font-medium text-white">
          Tonight&apos;s plans are one tap away.
        </h2>
        <p className="mt-4 max-w-[44ch] text-lead text-white/80">Making an account is free. Use your email, and your first pass is ready in under a minute.</p>
        <div className="mt-9 flex flex-wrap gap-3">
          <Link
            href={signedIn ? "/events" : "/signin?mode=signup"}
            className="inline-flex h-12 items-center rounded-xl bg-white px-6 text-[15px] font-semibold text-accent-ink transition-transform active:scale-[0.98]"
          >
            {signedIn ? "Find an event" : "Get your pass"}
          </Link>
          <Link href="/events" className="inline-flex h-12 items-center rounded-xl px-5 text-[15px] font-semibold text-white ring-1 ring-inset ring-white/40 transition-colors hover:bg-white/10">
            Browse what&apos;s on
          </Link>
        </div>
      </div>
    </section>
  );
}
