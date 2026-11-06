import type { Metadata } from "next";
import { Award, CalendarCheck2, Images, Ticket } from "lucide-react";
import { getViewer } from "@/lib/rbac";
import { getDashboardData } from "@/lib/data/dashboard";
import { PassCard } from "@/components/dashboard/PassCard";
import { MiniCalendar } from "@/components/dashboard/MiniCalendar";
import {
  Announcements,
  CampusRail,
  Certificates,
  EmptyNextUp,
  NavigatorTeaser,
  NextUpHero,
  OrganizerConsole,
  OrgKpis,
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
  const viewer = (await getViewer())!; // layout already redirected anonymous users
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
        <StatTile label="Certificates" value={data.stats.certificates} hint="earned so far" icon={Award} color="#fff3df" ink="#b45309" delay={160} />
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
        <NavigatorTeaser next={data.nextUp} />
        <Certificates items={data.certificates} />
      </section>
    </div>
  );
}
