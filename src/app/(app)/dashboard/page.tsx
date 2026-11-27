import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getViewer } from "@/lib/rbac";
import { getDashboardData } from "@/lib/data/dashboard";
import { getLandingData } from "@/lib/data/landing";
import { PublicHome } from "@/components/landing/Landing";
import { DiscoverFeed } from "@/components/landing/DiscoverFeed";
import { Row } from "@/components/landing/Row";
import { EventCard } from "@/components/landing/EventCard";
import { MonthCalendar } from "@/components/calendar/MonthCalendar";
import { getDB } from "@/lib/db";
import { calendarMonth } from "@/lib/data/calendar";
import { AddPhoneCard } from "@/components/profile/AddPhoneCard";
import { Agenda, UpdatesFeed, weekItems } from "@/components/dashboard/Agenda";
import { HomeHero } from "@/components/dashboard/HomeHero";
import { QuickDock } from "@/components/dashboard/QuickDock";
import { CATEGORY_HUBS } from "@/lib/discovery";

export const metadata: Metadata = { title: "Home" };
export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ denied?: string }>;
}) {
  const viewer = await getViewer();
  if (!viewer) return <PublicHome />;

  const [landing, month, data, params] = await Promise.all([
    getLandingData({ withPeople: true }),
    getDB().then((db) => calendarMonth(db, viewer.id)),
    getDashboardData(viewer),
    searchParams,
  ]);

  const next = data.nextUp;
  const live = data.organizer?.live;
  const week = weekItems(data.upcoming, data.campus);

  const hero =
    next ??
    data.campus.find((e) => +e.startsAt <= Date.now() && +e.endsAt > Date.now()) ??
    [...data.campus].sort((a, b) => b.registered - a.registered).find((e) => +e.startsAt - Date.now() < 14 * 86_400_000) ??
    data.campus[0] ??
    null;

  const recentRows = landing.rows.filter((r) => r.key === "recent" && r.events.length > 0);

  return (
    <div className="pb-16">
      <HomeHero
        name={viewer.name}
        isOrganizer={viewer.verifiedOrganizer}
        passCount={data.stats.registered}
        mine={!!next}
        dateLine={new Intl.DateTimeFormat("en-IN", {
          timeZone: "Asia/Kolkata",
          weekday: "long",
          day: "numeric",
          month: "long",
        }).format(new Date())}
        e={
          hero
            ? {
                id: hero.id,
                slug: hero.slug,
                title: hero.title,
                startsAt: hero.startsAt.toISOString(),
                endsAt: hero.endsAt.toISOString(),
                venueName: hero.venueName,
                accent: hero.accent,
                bannerUrl: hero.bannerUrl ?? null,
                registered: hero.registered,
                feePaise: hero.feePaise,
                passSerial: next?.passSerial ?? null,
              }
            : null
        }
      />

      <QuickDock passCount={data.stats.registered} isOrganizer={viewer.verifiedOrganizer} />

      {params.denied === "organizer" && (
        <p role="status" className="mt-6 border border-warn/40 bg-warn-soft px-4 py-3 text-[14px] text-warn">
          Hosting is available to verified organizers.
        </p>
      )}

      <div className="grid items-start gap-x-14 gap-y-12 pt-10 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <Agenda
          items={week.all.filter((e) => e.id !== hero?.id)}
          next={null}
          later={data.campus.filter((e) => e.id !== hero?.id && !week.rest.some((r) => r.id === e.id))}
        />

        <aside className="flex flex-col gap-10">
          {live && (
            <Link
              href={`/organizer/events/${live.id}/manage`}
              className="group flex items-center justify-between gap-4 border border-[#D4B87A]/40 bg-surface p-5 transition-colors hover:border-[#D4B87A]"
            >
              <span className="min-w-0">
                <span className="tr-meta block text-[#D4B87A]">Live · {live.checkedIn}/{live.registered} checked in</span>
                <span className="mt-1 block truncate font-display text-[24px] font-semibold italic text-ink">{live.title}</span>
              </span>
              <ArrowRight className="size-4 shrink-0 text-[#D4B87A] transition-transform group-hover:translate-x-1" aria-hidden />
            </Link>
          )}

          <UpdatesFeed items={data.announcements} />
        </aside>
      </div>

      {landing.discover.length > 0 && <DiscoverFeed events={landing.discover} />}

      {recentRows.length > 0 && (
        <div className="pt-10">
          {recentRows.map((r) => (
            <Row key={r.key} title={r.title} href={r.href}>
              {r.events.map((e) => (
                <li key={e.id}>
                  <EventCard e={e} />
                </li>
              ))}
            </Row>
          ))}
        </div>
      )}

      <section aria-labelledby="dash-cal-h" className="pt-14">
        <div className="mb-5 flex flex-wrap items-baseline justify-between gap-4 border-b border-line pb-3">
          <h2 id="dash-cal-h" className="font-display text-[clamp(28px,3vw,40px)] font-bold italic leading-none text-ink">
            Your Month
          </h2>
          <Link
            href="/calendar"
            className="tr-meta tr-link inline-flex min-h-[44px] items-center gap-1 text-ink-muted hover:text-[#D4B87A]"
          >
            Calendar <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </div>
        <MonthCalendar initial={month} signedIn />
      </section>

      <section aria-labelledby="dash-hubs-h" className="pt-14">
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-4 border-b border-line pb-3">
          <h2 id="dash-hubs-h" className="font-display text-[clamp(28px,3vw,40px)] font-bold italic leading-none text-ink">
            Explore
          </h2>
          <Link
            href="/events"
            className="tr-meta tr-link inline-flex min-h-[44px] items-center gap-1 text-ink-muted hover:text-[#D4B87A]"
          >
            All events <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </div>
        <ul className="grid grid-cols-1 md:grid-cols-2 md:gap-x-10">
          {CATEGORY_HUBS.map((cat) => (
            <li key={cat.slug} className="border-b border-line">
              <Link
                href={`/category/${cat.slug}`}
                className="group flex min-h-[58px] items-center justify-between gap-4 py-3.5 transition-colors hover:text-[#D4B87A]"
              >
                <span className="font-display text-[26px] font-semibold italic leading-tight text-ink transition-colors group-hover:text-[#D4B87A]">
                  {cat.name}
                </span>
                <ArrowRight className="size-4 shrink-0 text-[#D4B87A] transition-transform group-hover:translate-x-1" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {!viewer.phone && (
        <div className="pt-10">
          <AddPhoneCard />
        </div>
      )}
    </div>
  );
}
