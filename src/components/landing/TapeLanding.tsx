"use client";

import { useState } from "react";
import Link from "next/link";
import { m, useReducedMotion } from "motion/react";
import { ArrowUpRight } from "lucide-react";

const EASE_SLEEVE = [0.22, 1, 0.36, 1] as const;

type CategoryItem = {
  slug: string;
  name: string;
  note: string;
  meta: string;
  palette: [string, string, string];
};

const CAMPUS_ROOMS: CategoryItem[] = [
  {
    slug: "cultural-music",
    name: "Concerts & Cultural",
    note: "Auditorium evenings, open mic nights, Garba under floodlights, and live campus sets.",
    meta: "Live nights",
    palette: ["#2A211C", "#C9A26B", "#EEE8DD"],
  },
  {
    slug: "tech-hackathons",
    name: "Hackathons",
    note: "Overnight builds, team check ins, demo tables, and project showcases with instant badges.",
    meta: "36h builds",
    palette: ["#1A1F24", "#C9A26B", "#C4BEB2"],
  },
  {
    slug: "workshops",
    name: "Workshops",
    note: "Hands on studio sessions, design sprints, and lab intensives with capped seating.",
    meta: "Small rooms",
    palette: ["#24211B", "#B79462", "#E6DFD2"],
  },
  {
    slug: "sports-tournaments",
    name: "Sports",
    note: "Box cricket, midnight futsal, court finals, and inter college brackets across turf venues.",
    meta: "Turf & court",
    palette: ["#1C241E", "#C9A26B", "#DDD7CA"],
  },
  {
    slug: "talks-panels",
    name: "Talks & Panels",
    note: "Founder evenings, alumni firesides, and quiet Q&A sessions with reserved front rows.",
    meta: "Main hall",
    palette: ["#231D1E", "#C9A26B", "#E8E2D5"],
  },
];

const BUILT_IN = {
  students: [
    ["Offline QR pass", "LOCAL"],
    ["One tap seat claim", "INSTANT"],
    ["Waitlist auto hold", "2 HRS"],
    ["Face ID Photo Vault", "ON DEVICE"],
    ["Signed certificates", "VERIFY URL"],
  ],
  organizers: [
    ["Direct UPI payout", "0% CUT"],
    ["UTR verification", "BUILT IN"],
    ["Team registration", "CODES"],
    ["Approval queue", "MANUAL"],
    ["Attendee CSV export", "ONE CLICK"],
  ],
  gate: [
    ["Volunteer scan link", "NO LOGIN"],
    ["Offline verification", "UNDER 1S"],
    ["Live attendance tally", "REALTIME"],
    ["Walk in guest desk", "AT DOOR"],
    ["Duplicate scan guard", "LOCKED"],
  ],
} as const;

const FEATURED_NIGHTS = [
  {
    title: "Sunset Sessions",
    meta: "Example · Riverside Lawn · Live music",
    href: "/events",
    badge: "New",
    offset: "md:mt-0",
    variant: 0 as const,
  },
  {
    title: "HackNight 26",
    meta: "Example · Main Auditorium · 36h build",
    href: "/events",
    badge: null,
    offset: "md:mt-16",
    variant: 1 as const,
  },
  {
    title: "Garba Under Stars",
    meta: "Example · Central Quad · Cultural",
    href: "/events",
    badge: null,
    offset: "md:mt-6",
    variant: 2 as const,
  },
  {
    title: "Design Critique",
    meta: "Example · Studio Hall · Workshop",
    href: "/events",
    badge: null,
    offset: "md:mt-24",
    variant: 3 as const,
  },
];

const FEE_ROWS = [
  ["Student passbook and offline QR wallet", "0 INR"],
  ["Club event page, waitlist, and guest list", "0 INR"],
  ["Direct UPI ticket collection to your club", "0% CUT"],
  ["On device Photo Vault and signed certificates", "INCLUDED"],
] as const;

/** Abstract record-sleeve artwork (muted archival colors, zero text, zero drop shadow). */
function SleeveArt({ variant }: { variant: 0 | 1 | 2 | 3 }) {
  if (variant === 0) {
    return (
      <svg viewBox="0 0 400 400" className="size-full" aria-hidden>
        <rect width="400" height="400" fill="#231D19" />
        <circle cx="200" cy="200" r="118" fill="none" stroke="#C9A26B" strokeWidth="1.2" />
        <circle cx="200" cy="200" r="76" fill="#32271F" />
        <line x1="40" y1="200" x2="360" y2="200" stroke="#EEE8DD" strokeOpacity="0.22" strokeWidth="1" />
        <circle cx="200" cy="200" r="14" fill="#C9A26B" />
      </svg>
    );
  }
  if (variant === 1) {
    return (
      <svg viewBox="0 0 400 400" className="size-full" aria-hidden>
        <rect width="400" height="400" fill="#181C20" />
        <g stroke="#EEE8DD" strokeOpacity="0.16" strokeWidth="1">
          <line x1="80" y1="0" x2="80" y2="400" />
          <line x1="200" y1="0" x2="200" y2="400" />
          <line x1="320" y1="0" x2="320" y2="400" />
          <line x1="0" y1="120" x2="400" y2="120" />
          <line x1="0" y1="280" x2="400" y2="280" />
        </g>
        <rect x="116" y="116" width="168" height="168" fill="none" stroke="#C9A26B" strokeWidth="1.4" />
        <rect x="164" y="164" width="72" height="72" fill="#C9A26B" fillOpacity="0.25" />
      </svg>
    );
  }
  if (variant === 2) {
    return (
      <svg viewBox="0 0 400 400" className="size-full" aria-hidden>
        <rect width="400" height="400" fill="#26191D" />
        <circle cx="200" cy="200" r="138" fill="none" stroke="#EEE8DD" strokeOpacity="0.16" strokeWidth="1" />
        <circle cx="200" cy="200" r="96" fill="none" stroke="#C9A26B" strokeWidth="1.2" />
        <circle cx="200" cy="200" r="52" fill="none" stroke="#C9A26B" strokeOpacity="0.6" strokeWidth="1.2" />
        <path d="M200 62v276M62 200h276" stroke="#EEE8DD" strokeOpacity="0.14" strokeWidth="1" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 400 400" className="size-full" aria-hidden>
      <rect width="400" height="400" fill="#1F1D19" />
      <rect x="64" y="64" width="128" height="272" fill="#2B2720" />
      <rect x="208" y="136" width="128" height="200" fill="none" stroke="#C9A26B" strokeWidth="1.3" />
      <circle cx="272" cy="96" r="24" fill="#C9A26B" />
    </svg>
  );
}

/** Small restrained thumbnail shown beside hovered Swiss list rows. */
function CategoryThumb({ palette }: { palette: [string, string, string] }) {
  return (
    <svg viewBox="0 0 120 84" className="h-full w-full" aria-hidden>
      <rect width="120" height="84" fill={palette[0]} />
      <circle cx="60" cy="42" r="24" fill="none" stroke={palette[1]} strokeWidth="1.2" />
      <line x1="16" y1="42" x2="104" y2="42" stroke={palette[2]} strokeOpacity="0.3" strokeWidth="1" />
      <circle cx="60" cy="42" r="5" fill={palette[1]} />
    </svg>
  );
}

/**
 * Signature SVG element: two single-stroke gold reels (1.5px, no fill, no glow, no shadow)
 * joined by a thin pass-tape path. Rotates at 6s idle, speeds to 3s on hover, still under reduced-motion.
 */
function SignatureReels() {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      className="tr-reel-stage flex flex-col items-center justify-center py-16 md:py-24"
    >
      <svg
        viewBox="0 0 420 180"
        fill="none"
        className="w-full max-w-[380px] text-[#C9A26B]"
        role="img"
        aria-label="Two gold reels turning slowly in opposite directions joined by a thin pass ribbon"
      >
        {/* Left reel — clockwise */}
        <g className="tr-reel-cw">
          <circle cx="110" cy="84" r="54" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="110" cy="84" r="14" stroke="currentColor" strokeWidth="1.5" />
          <path d="M110 38v32M110 98v32M64 84h32M124 84h32" stroke="currentColor" strokeWidth="1.5" />
        </g>

        {/* Right reel — anticlockwise */}
        <g className="tr-reel-ccw">
          <circle cx="310" cy="84" r="54" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="310" cy="84" r="14" stroke="currentColor" strokeWidth="1.5" />
          <path d="M310 38v32M310 98v32M264 84h32M324 84h32" stroke="currentColor" strokeWidth="1.5" />
        </g>

        {/* Thin tape path dipping gently between the two reels; tightens slightly on hover */}
        <path
          d={hovered ? "M 110 138 Q 210 150 310 138" : "M 110 138 Q 210 160 310 138"}
          stroke="currentColor"
          strokeWidth="1.5"
          className="transition-[d] duration-500 ease-out"
        />
      </svg>

      <p className="tr-meta mt-8 max-w-[46ch] text-center text-[#9A9284]">
        Offline QR pass, signed locally, verified in under a second. Still running without WiFi.
      </p>
    </div>
  );
}

/** Pill CTA with a separate round arrow circle that slides 4px on hover. */
function GoldAction({
  href,
  label,
  tone = "gold",
}: {
  href: string;
  label: string;
  tone?: "gold" | "ink";
}) {
  const pill =
    tone === "gold"
      ? "bg-[#C9A26B] text-[#151412] group-hover:bg-[#D7B47F]"
      : "bg-[#151412] text-[#EEE8DD] group-hover:bg-[#23211E]";
  return (
    <Link href={href} className="group inline-flex items-center gap-2">
      <span
        className={`inline-flex h-12 items-center rounded-full px-6 font-mono text-[11px] uppercase tracking-[0.06em] transition-colors ${pill}`}
      >
        {label}
      </span>
      <span
        aria-hidden
        className={`grid size-12 place-items-center rounded-full transition-transform duration-base ease-out group-hover:translate-x-1 ${pill}`}
      >
        <ArrowUpRight className="size-4" strokeWidth={1.75} />
      </span>
    </Link>
  );
}

/**
 * Complete Tape Room editorial landing page tailored to EvntCult:
 * Alternating grounds (dark, paper, dark, surface inset, photo, dark, surface, paper, dark, gold inset)
 * with 1px hairlines, Gloock + Inter 300 + IBM Plex Mono, and zero drop shadows or boxed cards.
 */
export function TapeLanding() {
  const reduce = useReducedMotion();
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  return (
    <div className="bg-[#151412] text-[#EEE8DD]">
      {/* 1. HERO — Film title over full-bleed auditorium photograph */}
      <section
        aria-labelledby="hero-h"
        className="relative flex min-h-[clamp(460px,70vh,620px)] flex-col justify-end overflow-hidden bg-[#151412] md:min-h-[clamp(560px,82vh,860px)]"
      >
        <m.img
          src="/images/hero-hall.jpg"
          alt="Warm timber college auditorium stage lit by tungsten pendant lamps"
          fetchPriority="high"
          initial={reduce ? false : { scale: 1.03 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.1, ease: EASE_SLEEVE }}
          className="absolute inset-0 size-full object-cover object-center"
        />
        {/* Bottom-third dark legibility scrim only */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[62%]"
          style={{
            background:
              "linear-gradient(to top, rgba(21,20,18,0.92) 0%, rgba(21,20,18,0.52) 48%, rgba(21,20,18,0) 100%)",
          }}
        />

        <div className="relative z-10 mx-auto w-full max-w-[1200px] px-5 pb-12 pt-28 md:px-10 md:pb-16">
          <div className="grid grid-cols-1 items-end gap-8 md:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
            <m.h1
              id="hero-h"
              initial={reduce ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, ease: EASE_SLEEVE }}
              className="font-display leading-[0.96] tracking-[-0.02em] text-[#EEE8DD]"
              style={{ fontSize: "clamp(54px, 8.6vw, 136px)" }}
            >
              Every event,
              <br />
              one <em className="italic text-[#C9A26B]">pass</em>.
            </m.h1>

            <div className="flex flex-col items-start gap-6 md:items-end md:pb-2 md:text-right">
              <p className="max-w-[36ch] text-[16px] font-light leading-[1.55] text-[#EEE8DD]/80">
                A campus passbook built around one offline QR, direct UPI payments, and a quiet calendar that actually stays current.
              </p>
              <GoldAction href="/signin?mode=signup" label="Claim a seat" />
            </div>
          </div>
        </div>
      </section>

      {/* 2. STATEMENT — Archival paper ground (#EEE8DD) */}
      <section className="tr-paper bg-[#EEE8DD] py-24 text-[#151412] md:py-36">
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-8 px-5 md:grid-cols-3 md:px-10">
          <div>
            <p className="tr-meta text-[#605A50]">001/ The pass</p>
          </div>
          <div className="md:col-span-2">
            <p className="font-display text-[clamp(26px,3.1vw,42px)] leading-[1.2] tracking-[-0.015em] text-[#151412]">
              Campus nights should not live inside ten broken forms and buried group chats. Every concert, hackathon, club talk, and festival belongs on one quiet board. You claim a seat in seconds, pay your club straight by UPI, and carry a signed QR on your phone that opens the gate even when auditorium WiFi drops. It is a calmer way to run a campus and it keeps the evening about the room rather than the queue.
            </p>
          </div>
        </div>
      </section>

      {/* 3. CAMPUS HUBS — Dark Swiss list with hover reveal */}
      <section className="bg-[#151412] py-24 text-[#EEE8DD] md:py-36">
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-8 px-5 md:grid-cols-3 md:px-10">
          <div>
            <p className="tr-meta text-[#9A9284]">002/ On campus</p>
          </div>
          <div className="md:col-span-2">
            <ul className="divide-y divide-[rgba(238,232,221,0.15)] border-y border-[rgba(238,232,221,0.15)]">
              {CAMPUS_ROOMS.map((room) => {
                const isHover = hoveredRow === room.slug;
                return (
                  <li key={room.slug}>
                    <Link
                      href={`/category/${room.slug}`}
                      onPointerEnter={() => setHoveredRow(room.slug)}
                      onPointerLeave={() => setHoveredRow(null)}
                      className="group grid grid-cols-[56px_minmax(0,1fr)] items-center gap-4 py-7 transition-colors md:grid-cols-[minmax(0,1fr)_120px_auto] md:gap-8 md:py-9"
                    >
                      {/* Mobile left thumbnail */}
                      <div className="h-[42px] w-[56px] overflow-hidden rounded-[6px] border border-[rgba(238,232,221,0.15)] md:hidden">
                        <CategoryThumb palette={room.palette} />
                      </div>

                      <div className="min-w-0">
                        <h2 className="font-display text-[clamp(34px,4.6vw,64px)] leading-[0.98] tracking-[-0.02em] text-[#EEE8DD] transition-colors group-hover:text-[#C9A26B]">
                          {room.name}
                        </h2>
                        <p className="mt-2.5 max-w-[44ch] text-[15px] font-light leading-[1.55] text-[#9A9284]">
                          {room.note}
                        </p>
                      </div>

                      {/* Desktop hover preview */}
                      <div
                        aria-hidden
                        className="hidden h-[84px] w-[120px] overflow-hidden rounded-[8px] border border-[rgba(238,232,221,0.15)] transition-opacity duration-base md:block"
                        style={{ opacity: isHover ? 1 : 0 }}
                      >
                        <CategoryThumb palette={room.palette} />
                      </div>

                      <span className="tr-meta col-start-2 text-[#9A9284] md:col-start-auto md:text-right">
                        {room.meta}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>

      {/* 4. SIGNATURE PANEL — Inset surface ground (#1D1B18) with turning gold reels */}
      <section className="bg-[#151412] px-4 py-4">
        <div className="mx-auto max-w-[1360px] rounded-[24px] border border-[rgba(238,232,221,0.12)] bg-[#1D1B18] px-5 md:px-10">
          <SignatureReels />
        </div>
      </section>

      {/* 5. THE GATE — Full-bleed photograph interlude */}
      <section className="relative mt-16 overflow-hidden bg-[#151412] md:mt-24">
        <div className="relative aspect-[16/10] w-full overflow-hidden md:aspect-[21/10]">
          <m.img
            src="/images/gate-desk.jpg"
            alt="Walnut check in desk with cotton passes, matte black smartphone, and warm brass lamp"
            initial={reduce ? false : { scale: 1.03 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 1.1, ease: EASE_SLEEVE }}
            className="size-full object-cover"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-28"
            style={{
              background: "linear-gradient(to top, rgba(21,20,18,0.82), rgba(21,20,18,0))",
            }}
          />
          <p className="tr-meta absolute bottom-5 left-5 text-[#EEE8DD]/85 md:bottom-8 md:left-10">
            The gate desk, phone in hand, no printouts required.
          </p>
        </div>
      </section>

      {/* 6. BUILT IN — Dense 3-column ruled hairline index (DARK) */}
      <section className="bg-[#151412] py-24 text-[#EEE8DD] md:py-36">
        <div className="mx-auto max-w-[1200px] px-5 md:px-10">
          <div className="mb-12 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <p className="tr-meta text-[#9A9284]">003/ Built in</p>
            <h2 className="font-display text-[clamp(40px,5vw,68px)] leading-[0.98] tracking-[-0.02em] text-[#EEE8DD]">
              Everything the door <em className="italic text-[#C9A26B]">needs</em>.
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3">
            {(
              [
                ["Students", BUILT_IN.students],
                ["Organizers", BUILT_IN.organizers],
                ["Gate & Vault", BUILT_IN.gate],
              ] as const
            ).map(([heading, rows]) => (
              <div key={heading}>
                <h3 className="tr-meta border-b border-[rgba(238,232,221,0.28)] pb-3 text-[#C9A26B]">
                  {heading}
                </h3>
                <ul className="divide-y divide-[rgba(238,232,221,0.15)]">
                  {rows.map(([label, spec]) => (
                    <li
                      key={label}
                      className="flex items-baseline justify-between gap-4 py-3.5 text-[15px] font-light text-[#EEE8DD]"
                    >
                      <span>{label}</span>
                      <span className="tr-meta shrink-0 text-[#9A9284]">{spec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. FEATURED NIGHTS — Loose offset grid on surface ground (#1D1B18) */}
      <section className="bg-[#1D1B18] py-24 text-[#EEE8DD] md:py-36">
        <div className="mx-auto max-w-[1200px] px-5 md:px-10">
          <div className="mb-14 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <p className="tr-meta text-[#9A9284]">004/ On the calendar</p>
            <Link
              href="/events"
              className="tr-meta tr-link text-[#EEE8DD] hover:text-[#C9A26B]"
            >
              Browse all events
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
            {FEATURED_NIGHTS.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className={`group block ${item.offset}`}
              >
                <div className="aspect-square overflow-hidden rounded-[8px] border border-[rgba(238,232,221,0.15)]">
                  <div className="size-full transition-transform duration-slow ease-out group-hover:scale-[1.03]">
                    <SleeveArt variant={item.variant} />
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <h3 className="font-display text-[24px] leading-tight text-[#EEE8DD] transition-colors group-hover:text-[#C9A26B]">
                    {item.title}
                  </h3>
                  {item.badge && (
                    <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.06em] text-[#C9A26B]">
                      <span className="size-1.5 rounded-full bg-[#C9A26B]" aria-hidden />
                      {item.badge}
                    </span>
                  )}
                </div>
                <p className="tr-meta mt-1.5 text-[#9A9284]">{item.meta}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 8. ONE QUOTE — Centred Gloock 40px on archival paper ground (#EEE8DD) */}
      <section className="tr-paper bg-[#EEE8DD] py-28 text-[#151412] md:py-40">
        <div className="mx-auto max-w-[820px] px-5 text-center md:px-10">
          <blockquote className="font-display text-[clamp(28px,3.6vw,44px)] leading-[1.18] tracking-[-0.02em] text-[#151412]">
            &ldquo;We checked in six hundred students in twenty minutes while the auditorium WiFi was down. Nobody waited outside once.&rdquo;
          </blockquote>
          <p className="tr-meta mt-8 text-[#605A50]">
            Cultural Secretary, Annual Campus Fest
          </p>
        </div>
      </section>

      {/* 9. TRANSPARENT FEES — Hairline rows on dark ground (#151412) */}
      <section className="bg-[#151412] py-24 text-[#EEE8DD] md:py-36">
        <div className="mx-auto max-w-[1200px] px-5 md:px-10">
          <div className="mb-12 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <p className="tr-meta text-[#9A9284]">005/ Fees</p>
            <h2 className="font-display text-[clamp(40px,5vw,68px)] leading-[0.98] tracking-[-0.02em] text-[#EEE8DD]">
              Zero cut from your club.
            </h2>
          </div>

          <ul className="divide-y divide-[rgba(238,232,221,0.15)] border-y border-[rgba(238,232,221,0.15)]">
            {FEE_ROWS.map(([label, rate]) => (
              <li
                key={label}
                className="flex flex-col justify-between gap-2 py-6 sm:flex-row sm:items-baseline"
              >
                <span className="text-[18px] font-light text-[#EEE8DD]">{label}</span>
                <span className="tr-meta shrink-0 text-[#C9A26B]">{rate}</span>
              </li>
            ))}
          </ul>

          <p className="tr-meta mt-6 text-[#9A9284]">
            Payments settle directly to your club UPI account. EvntCult takes nothing.
          </p>
        </div>
      </section>

      {/* 10. CLOSING CTA — Inset gold accent panel (#C9A26B) */}
      <section className="bg-[#151412] px-4 pb-16 pt-4 md:pb-24">
        <div className="mx-auto max-w-[1360px] rounded-[24px] bg-[#C9A26B] px-6 py-16 text-[#151412] md:px-16 md:py-24">
          <div className="mx-auto max-w-[1120px]">
            <h2 className="max-w-[15ch] font-display text-[clamp(42px,6vw,84px)] leading-[0.96] tracking-[-0.02em] text-[#151412]">
              Bring your club and a Friday night.
            </h2>
            <div className="mt-10 flex flex-wrap items-center gap-6">
              <GoldAction href="/signin?mode=signup" label="Sign up free" tone="ink" />
              <Link
                href="/host"
                className="tr-meta tr-link inline-flex min-h-[44px] items-center text-[#151412]"
              >
                Ask about hosting your fest
              </Link>
            </div>
            <p className="tr-meta mt-10 text-[#151412]/70">
              Open to every campus student and verified club.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
