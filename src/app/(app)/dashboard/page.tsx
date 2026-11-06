import type { Metadata } from "next";
import { CalendarCheck2, DoorOpen, Images, Map as MapIcon, Award, Ticket } from "lucide-react";
import { getViewer } from "@/lib/rbac";
import { getDashboardData, getPublicDashboard } from "@/lib/data/dashboard";
import Link from "next/link";
import { EventArt } from "@/components/ui/EventArt";
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
      <header className="pt-4 animate-fade-up md:pt-6">
        <p className="eyebrow">{new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Kolkata" }).format(new Date())}</p>
        <h1 className="headline mt-1 text-[clamp(30px,4.2vw,44px)] leading-[1.05] tracking-tightest">
          {greeting()}, {firstName} <span className="inline-block animate-float">👋</span>
        </h1>
        <p className="mt-1 text-[16px] font-medium text-ink-muted">{summary}</p>
        {params.denied === "organizer" && (
          <p className="mt-3 inline-block rounded-full bg-warn-soft px-4 py-1.5 text-[13px] font-semibold text-warn">
            The organizer console is only for verified organizers.
          </p>
        )}
      </header>
      {!viewer.phone && <AddPhoneCard />}
      <QuickTiles />

      {/* Next up + pass */}
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-8">{data.nextUp ? <NextUpHero event={data.nextUp} /> : <EmptyNextUp />}</div>
        {data.nextUp && (
          <div className="lg:col-span-4">
            <PassCard pass={data.nextUp} />
          </div>
        )}
      </div>
      {data.nextUp?.paymentStatus === "PENDING" && <UpiPending amountPaise={data.nextUp.feePaise} />}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Registered" value={data.stats.registered} hint="upcoming events" icon={Ticket} color="#efebff" ink="#3b22d6" delay={60} />
        <StatTile label="This week" value={data.stats.thisWeek} hint="on your calendar" icon={CalendarCheck2} color="#e0f2fe" ink="#0369a1" delay={110} />
        <StatTile label="Attended" value={data.stats.attended} hint="checked in at the gate" icon={DoorOpen} color="#fff3df" ink="#b45309" delay={160} />
        <StatTile label="Photos of you" value={data.stats.photosOfYou} hint="in the vault" icon={Images} color="#ffe4ec" ink="#be123c" delay={210} />
      </div>

      {/* Organizer console */}
      {data.organizer && (
        <section className="space-y-4 pt-6">
          <div className="flex flex-wrap items-end justify-between gap-3 animate-fade-up">
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
      <section className="grid gap-4 pt-2 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Announcements items={data.announcements} />
        </div>
        <div className="lg:col-span-4">
          <UpcomingList events={data.upcoming} />
        </div>
        <div className="card p-6 animate-fade-up lg:col-span-3">
          <MiniCalendar data={data.calendar} />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <VaultTeaser photosOfYou={data.stats.photosOfYou} />
        <PlannedCard eyebrow="Venue Navigator" title="Campus map & directions" icon={MapIcon} body="Walking directions to every hall, lab and ground. Not built yet." />
        <PlannedCard eyebrow="Certificates" title="Proof of attendance" icon={Award} body="Certificates for events you checked in to. Not built yet." />
      </section>
    </div>
  );
}

/** What a signed-out visitor sees: real campus events and numbers, plus Log in / Sign up. */
async function PublicHome() {
  const d = await getPublicDashboard();
  return (
    <div className="space-y-5">
      <section className="card relative isolate mt-4 overflow-hidden p-7 text-white animate-fade-up md:mt-6 md:p-10">
        <EventArt accent="violet" />
        <div className="relative max-w-2xl">
          <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-white/80">Campus events · KKW</p>
          <h1 className="mt-2 text-[clamp(34px,5vw,58px)] font-extrabold leading-[1.02] tracking-tightest">Register. Get your pass. Walk in.</h1>
          <p className="mt-3 max-w-lg text-[17px] text-white/85">Browse every fest, game night and workshop on campus. Sign up with your college email to register and get a QR pass.</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link href="/signin?mode=signup" className="rounded-full bg-white px-5 py-3 text-[15px] font-semibold text-ink hover:bg-white/90">Sign up</Link>
            <Link href="/signin" className="rounded-full border border-white/50 px-5 py-3 text-[15px] font-semibold text-white hover:bg-white/10">Log in</Link>
            <Link href="/events" className="rounded-full px-5 py-3 text-[15px] font-semibold text-white/90 underline-offset-4 hover:underline">Browse events →</Link>
          </div>
        </div>
      </section>
      <QuickTiles />
      <div className="grid grid-cols-3 gap-3">
        <StatTile label="Events this week" value={d.thisWeek} hint="open to everyone" icon={CalendarCheck2} color="#e0f2fe" ink="#0369a1" />
        <StatTile label="Upcoming events" value={d.upcoming} hint="on campus" icon={Ticket} color="#efebff" ink="#3b22d6" delay={60} />
        <StatTile label="Students going" value={d.going.toLocaleString("en-IN")} hint="registered so far" icon={Images} color="#ffe4ec" ink="#be123c" delay={120} />
      </div>
      <div className="pt-4">
        <CampusRail events={d.campus} />
      </div>
      <section className="grid gap-4 md:grid-cols-2">
        <div className="card p-6 animate-fade-up">
          <MiniCalendar data={d.calendar} />
        </div>
        <PlannedCard eyebrow="Venue Navigator" title="Campus map & directions" icon={MapIcon} body="Walking directions to every hall, lab and ground. Not built yet." />
      </section>
    </div>
  );
}
