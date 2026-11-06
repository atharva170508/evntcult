import type { Metadata } from "next";
import { CalendarCheck2, DoorOpen, Images, Map as MapIcon, Award, Ticket } from "lucide-react";
import { getViewer } from "@/lib/rbac";
import { getDashboardData, getPublicDashboard } from "@/lib/data/dashboard";
import Link from "next/link";
import { EventArt } from "@/components/ui/EventArt";
import { Magnetic, Reveal, Stagger, TextEffect } from "@/components/motion/primitives";
import { PassCard } from "@/components/dashboard/PassCard";
import { AddPhoneCard } from "@/components/profile/AddPhoneCard";
import { MiniCalendar } from "@/components/dashboard/MiniCalendar";
import {
  Announcements,
  CampusRail,
  EmptyNextUp,
  NextUpHero,
  OrganizerConsole,
  OrgKpis,
  PlannedCard,
  QuickTiles,
  StatTile,
  UpcomingList,
  UpiPending,
  VaultTeaser,
} from "@/components/dashboard/sections";

export const metadata: Metadata = { title: "Home" };
export const dynamic = "force-dynamic";

function greeting() {
  const h = Number(new Intl.DateTimeFormat("en-IN", { hour: "numeric", hour12: false, timeZone: "Asia/Kolkata" }).format(new Date()));
  return h < 5 ? "Up late" : h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const viewer = await getViewer();
  if (!viewer) return <PublicHome />;
  const [data, params] = await Promise.all([getDashboardData(viewer), searchParams]);
  const firstName = viewer.name.split(" ")[0];

  const summary = [
    data.stats.thisWeek ? `${data.stats.thisWeek} event${data.stats.thisWeek > 1 ? "s" : ""} this week` : "A quiet week",
    data.organizer?.live ? "1 of yours is live right now" : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="space-y-5">
      {/* Greeting + quick tiles */}
      <header className="pt-4 md:pt-6">
        <p className="eyebrow">{new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Kolkata" }).format(new Date())}</p>
        <TextEffect text={`${greeting()}, ${firstName}.`} className="headline mt-1.5 text-[clamp(32px,4.4vw,48px)] leading-[1.02] tracking-tightest" />
        <Reveal delay={0.15} y={6}>
          <p className="mt-1.5 text-[16px] font-medium text-ink-muted">{summary}</p>
        </Reveal>
        {params.denied === "organizer" && (
          <p className="mt-3 inline-block rounded-full bg-warn-soft px-4 py-1.5 text-[13px] font-semibold text-warn">
            The organizer console is only for verified organizers.
          </p>
        )}
      </header>
      {!viewer.phone && <AddPhoneCard />}
      <QuickTiles />

      {/* Next up + pass */}
      <Reveal className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-8">{data.nextUp ? <NextUpHero event={data.nextUp} /> : <EmptyNextUp />}</div>
        {data.nextUp && (
          <div className="lg:col-span-4">
            <PassCard pass={data.nextUp} />
          </div>
        )}
      </Reveal>
      {data.nextUp?.paymentStatus === "PENDING" && <UpiPending amountPaise={data.nextUp.feePaise} />}

      {/* Stats */}
      <Stagger className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Registered" value={data.stats.registered} hint="upcoming events" icon={Ticket} tone="brand" />
        <StatTile label="This week" value={data.stats.thisWeek} hint="on your calendar" icon={CalendarCheck2} tone="accent" />
        <StatTile label="Attended" value={data.stats.attended} hint="checked in at the gate" icon={DoorOpen} tone="live" />
        <StatTile label="Photos of you" value={data.stats.photosOfYou} hint="in the vault" icon={Images} tone="neutral" />
      </Stagger>

      {/* Organizer console */}
      {data.organizer && (
        <section className="space-y-4 pt-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="eyebrow">Organizer</p>
              <h2 className="headline mt-1 text-[26px]">Your events, at a glance</h2>
            </div>
          </div>
          <OrgKpis data={data.organizer} />
          <OrganizerConsole data={data.organizer} />
        </section>
      )}

      {/* Campus events */}
      <div className="pt-6">
        <CampusRail events={data.campus} />
      </div>

      {/* Personal */}
      <Stagger className="grid gap-4 pt-2 lg:grid-cols-12" itemClassName="lg:[&:nth-child(1)]:col-span-5 lg:[&:nth-child(2)]:col-span-4 lg:[&:nth-child(3)]:col-span-3">
        <Announcements items={data.announcements} />
        <UpcomingList events={data.upcoming} />
        <div className="card h-full p-6">
          <MiniCalendar data={data.calendar} />
        </div>
      </Stagger>

      <Stagger className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <VaultTeaser photosOfYou={data.stats.photosOfYou} />
        <PlannedCard eyebrow="Venue Navigator" title="Campus map & directions" icon={MapIcon} body="Walking directions to every hall, lab and ground. Not built yet." />
        <PlannedCard eyebrow="Certificates" title="Proof of attendance" icon={Award} body="Certificates for events you checked in to. Not built yet." />
      </Stagger>
    </div>
  );
}

/** What a signed-out visitor sees: real campus events and numbers, plus Log in / Sign up. */
async function PublicHome() {
  const d = await getPublicDashboard();
  return (
    <div className="space-y-5">
      <section className="card relative isolate mt-4 overflow-hidden border-0 p-7 text-paper md:mt-6 md:p-12">
        <EventArt accent="violet" />
        <div className="relative max-w-2xl">
          <p className="font-mono text-[11.5px] font-medium uppercase tracking-[0.16em] text-paper/80">Campus events · KKW</p>
          <TextEffect text="Register. Get your pass. Walk in." className="mt-3 font-display text-[clamp(40px,6vw,76px)] font-bold leading-[0.95] tracking-tightest" delay={0.1} />
          <Reveal delay={0.35} y={8}>
            <p className="mt-4 max-w-lg text-[17px] leading-relaxed text-paper/85">
              Every fest, game night and workshop on campus in one place. Sign up with your college email to register and get a QR pass.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-2">
              <Magnetic>
                <Link href="/signin?mode=signup" className="rounded-full bg-paper px-6 py-3.5 text-[15px] font-semibold text-night transition-transform active:scale-[0.97]">
                  Sign up free
                </Link>
              </Magnetic>
              <Link href="/signin" className="rounded-full border border-paper/45 px-6 py-3.5 text-[15px] font-semibold text-paper transition-colors hover:bg-paper/10">
                Log in
              </Link>
              <Link href="/events" className="group px-3 py-3.5 text-[15px] font-semibold text-paper/90">
                Browse events <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
      <QuickTiles />
      <Stagger className="grid grid-cols-3 gap-3">
        <StatTile label="Events this week" value={d.thisWeek} hint="open to everyone" icon={CalendarCheck2} tone="accent" />
        <StatTile label="Upcoming events" value={d.upcoming} hint="on campus" icon={Ticket} tone="brand" />
        <StatTile label="Students going" value={d.going} hint="registered so far" icon={Images} tone="live" />
      </Stagger>
      <div className="pt-4">
        <CampusRail events={d.campus} />
      </div>
      <section className="grid gap-4 md:grid-cols-2">
        <div className="card p-6">
          <MiniCalendar data={d.calendar} />
        </div>
        <PlannedCard eyebrow="Venue Navigator" title="Campus map & directions" icon={MapIcon} body="Walking directions to every hall, lab and ground. Not built yet." />
      </section>
    </div>
  );
}
