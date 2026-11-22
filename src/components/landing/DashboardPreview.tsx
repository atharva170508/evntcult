import Link from "next/link";
import { Award, Bell, Images } from "lucide-react";
import { EventArt } from "@/components/ui/EventArt";
import { Magnetic } from "@/components/motion/Magnetic";
import { Reveal } from "@/components/motion/Reveal";
import { BrandLogo } from "@/components/site/Brand";

const cta =
  "inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-lavender px-6 text-[16px] font-semibold text-ink shadow-button ring-2 ring-inset ring-ink transition-[background-color,transform] duration-fast hover:bg-lavender-hover active:scale-[0.97]";

/* Made-up sample content. It is labelled "Example" on screen; none of it is a real event or person. */
const WEEK = [
  { d: "Mon", n: 0, mine: false },
  { d: "Tue", n: 1, mine: false },
  { d: "Wed", n: 2, mine: true },
  { d: "Thu", n: 0, mine: false },
  { d: "Fri", n: 3, mine: true, picked: true },
  { d: "Sat", n: 2, mine: false },
  { d: "Sun", n: 1, mine: false },
];
const UPDATES = [
  {
    icon: Bell,
    title: "Venue changed",
    body: "Lantern Fest moves to the North Lawn, 7:30 pm",
    when: "12 min ago",
  },
  {
    icon: Images,
    title: "Photos are up",
    body: "48 photos from Hack Night, 6 of them with you",
    when: "2 h ago",
  },
  {
    icon: Award,
    title: "Certificate ready",
    body: "Quiz Bowl, participation",
    when: "Yesterday",
  },
];

/**
 * What the signed-in home looks like, for visitors: greeting, next pass, the week, a live gate
 * count and updates. Built from the app's own parts with made-up content, labelled "Example",
 * so no real event, date or name ever reaches a signed-out visitor.
 */
export function DashboardPreview() {
  return (
    <section id="preview" aria-labelledby="preview-h" className="scroll-mt-28">
      <Reveal className="py-12 md:py-20">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <h2
            id="preview-h"
            className="font-display text-[clamp(44px,6vw,80px)] leading-[0.95] tracking-[-0.03em] text-ink"
          >
            A look inside.
          </h2>
          <Magnetic className="inline-block shrink-0">
            <Link href="/signin?mode=signup" className={cta}>
              Sign up free
            </Link>
          </Magnetic>
        </div>

        <figure className="mt-10">
          <div
            data-sample="true"
            className="overflow-hidden rounded-[28px] border border-line-strong bg-canvas shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_50px_90px_-50px_rgba(60,40,10,0.55)]"
          >
            {/* The app's header, in miniature */}
            <div className="flex items-center gap-4 border-b border-line bg-canvas px-4 py-3 md:px-6">
              <BrandLogo className="text-[17px]" />
              <span
                className="hidden items-center gap-5 text-[13px] font-medium text-ink-muted sm:flex"
                aria-hidden
              >
                <span className="relative font-semibold text-ink after:absolute after:inset-x-0 after:-bottom-[13px] after:h-[2px] after:bg-ink">
                  Home
                </span>
                <span>Discover</span>
                <span>Calendar</span>
                <span>My Passes</span>
              </span>
              <span className="ml-auto rounded-lg bg-sunken px-2.5 py-1 text-[12px] font-semibold text-ink-2">
                Example
              </span>
              <span
                aria-hidden
                className="grid size-8 place-items-center rounded-full bg-ink text-[12px] font-semibold text-white"
              >
                ZK
              </span>
            </div>

            <div className="grid gap-4 p-4 md:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] md:gap-5 md:p-7">
              <div className="flex min-w-0 flex-col gap-4 md:gap-5">
                <p className="font-display text-[clamp(34px,4.4vw,52px)] leading-none tracking-[-0.03em] text-ink">
                  Good evening, Zoya.
                </p>

                {/* Next pass */}
                <div className="flex overflow-hidden rounded-[20px] border border-line-strong bg-white">
                  <div className="relative w-[36%] shrink-0 overflow-hidden">
                    <EventArt
                      accent="violet"
                      seed="preview-next-event"
                      scrim={false}
                    />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5">
                    <p className="text-[12.5px] font-semibold text-accent">
                      Your next event · in 2 days
                    </p>
                    <p className="mt-1 truncate text-[17px] font-semibold leading-snug text-ink sm:text-[19px]">
                      Robotics Build Night
                    </p>
                    <p className="mt-1 text-[13.5px] text-ink-muted">
                      Friday · 7:00 pm · Block D Hall
                    </p>
                    <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
                      <span className="inline-flex h-9 items-center rounded-lg bg-ink px-3.5 text-[13px] font-semibold text-white">
                        Show pass
                      </span>
                      <span className="font-mono text-[12px] tracking-[0.08em] text-ink-muted">
                        EC-ROBO-0142
                      </span>
                    </div>
                  </div>
                </div>

                {/* This week */}
                <div className="rounded-[20px] border border-line-strong bg-white p-4 sm:p-5">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-[15px] font-semibold text-ink">
                      This week
                    </p>
                    <p className="text-[12.5px] text-ink-muted">
                      2 yours, 9 nearby
                    </p>
                  </div>
                  <ol className="mt-3 grid grid-cols-7 gap-1.5">
                    {WEEK.map((w) => (
                      <li
                        key={w.d}
                        className={`flex flex-col items-center gap-1.5 rounded-xl py-2.5 ${w.picked ? "bg-lavender/60 ring-2 ring-inset ring-ink" : "bg-sunken"}`}
                      >
                        <span
                          className={`text-[11.5px] ${w.mine ? "font-semibold text-ink" : "text-ink-muted"}`}
                        >
                          {w.d}
                        </span>
                        <span className="flex h-1.5 gap-0.5" aria-hidden>
                          {Array.from({ length: w.n }, (_, i) => (
                            <span
                              key={i}
                              className={`size-1.5 rounded-full ${w.mine && i === 0 ? "bg-ink" : "ring-1 ring-inset ring-ink-subtle"}`}
                            />
                          ))}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              <div className="flex min-w-0 flex-col gap-4 md:gap-5">
                {/* Live at the gate */}
                <div className="rounded-[20px] bg-night p-5 text-cream">
                  <p className="flex items-center gap-2 text-[13px] font-semibold text-cream/80">
                    <span
                      className="size-2 rounded-full bg-[#5EE0A8]"
                      aria-hidden
                    />{" "}
                    Live now · Lantern Fest
                  </p>
                  <p className="mt-4 flex items-baseline gap-2">
                    <span className="font-display text-[56px] leading-none tracking-[-0.03em] tabular-nums">
                      212
                    </span>
                    <span className="text-[14px] text-cream/70">
                      checked in of 260
                    </span>
                  </p>
                  <div
                    className="mt-4 h-2 overflow-hidden rounded-full bg-white/15"
                    aria-hidden
                  >
                    <div className="h-full w-[82%] rounded-full bg-lavender" />
                  </div>
                  <p className="mt-3 text-[12.5px] text-cream/60">
                    Gate open since 6:30 pm
                  </p>
                </div>

                {/* Updates */}
                <div className="flex-1 rounded-[20px] border border-line-strong bg-white p-4 sm:p-5">
                  <p className="text-[15px] font-semibold text-ink">Updates</p>
                  <ul className="mt-1 divide-y divide-line">
                    {UPDATES.map((u) => (
                      <li key={u.title} className="flex gap-3 py-3">
                        <span
                          className="grid size-8 shrink-0 place-items-center rounded-full bg-sunken text-ink"
                          aria-hidden
                        >
                          <u.icon className="size-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[13.5px] font-semibold text-ink">
                            {u.title}
                          </span>
                          <span className="block text-[13px] leading-snug text-ink-2">
                            {u.body}
                          </span>
                          <span className="block text-[12px] text-ink-subtle">
                            {u.when}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <figcaption className="mt-3 text-[12.5px] text-ink-subtle">
            Example screen with made-up events and names. Sign up to see your
            own passes, calendar and updates.
          </figcaption>
        </figure>
      </Reveal>
    </section>
  );
}
