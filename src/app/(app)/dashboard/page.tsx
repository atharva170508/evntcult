import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Download, Ticket } from "lucide-react";
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
  // Logged-out visitors get the dedicated public homepage; no user or event data is loaded.
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

  // The hero: your next pass, or else the best thing coming up (live first, then soonest).
  const hero =
    next ??
    data.campus.find((e) => +e.startsAt <= Date.now() && +e.endsAt > Date.now()) ??
    [...data.campus].sort((a, b) => b.registered - a.registered).find((e) => +e.startsAt - Date.now() < 14 * 86_400_000) ??
    data.campus[0] ??
    null;

  const recentRows = landing.rows.filter((r) => r.key === "recent" && r.events.length > 0);

  return (
    <div className="pb-14">
      {/* 1. Personal Hero: Active Boarding Pass OR 3-Pass Interactive Studio */}
      <HomeHero
        name={viewer.name}
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

      {/* 2. Seamless 1-Tap Command Dock + Inline Event Code Jumper */}
      <QuickDock passCount={data.stats.registered} isOrganizer={viewer.verifiedOrganizer} />

      {params.denied === "organizer" && (
        <p role="status" className="mt-6 rounded-lg bg-warn-soft px-4 py-3 text-[14px] font-medium text-warn">
          Hosting is only for verified organizers.
        </p>
      )}

      {/* 3. Personal Weekly Agenda + Live Ops, Updates & Quick Desk */}
      <div className="grid items-start gap-x-14 gap-y-12 pt-9 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <Agenda
          items={week.all.filter((e) => e.id !== hero?.id)}
          next={null}
          later={data.campus.filter((e) => e.id !== hero?.id && !week.rest.some((r) => r.id === e.id))}
        />

        <aside className="flex flex-col gap-10">
          {live && (
            <Link
              href={`/organizer/events/${live.id}/manage`}
              className="flex items-center gap-4 rounded-2xl bg-ink p-5 text-white transition-colors duration-fast hover:bg-night-2"
            >
              <span className="relative flex size-2.5 shrink-0">
                <span className="absolute inset-0 rounded-full bg-accent motion-safe:animate-ping" />
                <span className="relative size-2.5 rounded-full bg-accent" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[16px] font-semibold">{live.title}</span>
                <span className="block text-[13.5px] tabular-nums text-white/70">
                  Live now, {live.checkedIn} of {live.registered} checked in
                </span>
              </span>
              <ChevronRight className="size-5 shrink-0" aria-hidden />
            </Link>
          )}

          <UpdatesFeed items={data.announcements} />

          {/* Compact non-redundant account status & offline app strip */}
          <section aria-labelledby="glance-h" className="divide-y divide-line border-t border-line">
            <h2 id="glance-h" className="sr-only">Account shortcuts</h2>
            <Link
              href="/passes"
              className="group flex items-center justify-between gap-3 py-3.5 transition-colors hover:text-ink"
            >
              <span className="flex items-center gap-3">
                <Ticket className="size-4 shrink-0 text-ink-muted group-hover:text-ink" aria-hidden />
                <span className="text-[14px] font-semibold text-ink">
                  {data.stats.registered === 0
                    ? "No active passes yet"
                    : data.stats.registered === 1
                      ? "1 active pass"
                      : `${data.stats.registered} active passes`}
                </span>
              </span>
              <ChevronRight className="size-4 text-ink-muted transition-transform group-hover:translate-x-0.5 group-hover:text-ink" aria-hidden />
            </Link>

            <Link
              href="/get-app"
              className="group flex items-center justify-between gap-3 py-3.5 transition-colors hover:text-ink"
            >
              <span className="flex items-center gap-3">
                <Download className="size-4 shrink-0 text-ink-muted group-hover:text-ink" aria-hidden />
                <span>
                  <span className="block text-[14px] font-semibold text-ink">Install offline app</span>
                  <span className="block text-[12.5px] text-ink-muted">Keep gate QR codes on your home screen</span>
                </span>
              </span>
              <ChevronRight className="size-4 text-ink-muted transition-transform group-hover:translate-x-0.5 group-hover:text-ink" aria-hidden />
            </Link>
          </section>
        </aside>
      </div>

      {/* 4. Live Campus Discovery Feed (real events only, zero marketing fluff) */}
      {landing.discover.length > 0 && (
        <div className="pt-10">
          <DiscoverFeed events={landing.discover} />
        </div>
      )}

      {recentRows.length > 0 && (
        <div className="pt-8">
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

      {/* 5. Your Month Calendar */}
      <section aria-labelledby="dash-cal-h" className="pt-12">
        <div className="mb-5 flex flex-wrap items-baseline justify-between gap-4 border-b border-ink pb-3">
          <h2 id="dash-cal-h" className="text-[18px] font-semibold text-ink">
            Your month
          </h2>
          <Link
            href="/calendar"
            className="inline-flex items-center gap-1 text-[14px] font-semibold text-ink-2 hover:text-ink"
          >
            Full calendar <ChevronRight className="size-4" aria-hidden />
          </Link>
        </div>
        <MonthCalendar initial={month} signedIn />
      </section>

      {/* 6. Quick Category Directory */}
      <section aria-labelledby="dash-hubs-h" className="pt-12">
        <div className="mb-5 flex flex-wrap items-baseline justify-between gap-4 border-b border-ink pb-3">
          <h2 id="dash-hubs-h" className="text-[18px] font-semibold text-ink">
            Browse by category
          </h2>
          <Link
            href="/events"
            className="inline-flex items-center gap-1 text-[14px] font-semibold text-ink-2 hover:text-ink"
          >
            All events <ChevronRight className="size-4" aria-hidden />
          </Link>
        </div>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_HUBS.map((cat) => (
            <Link
              key={cat.slug}
              href={`/category/${cat.slug}`}
              className="inline-flex h-9 items-center rounded-full border border-line-strong bg-surface px-3.5 text-[13.5px] font-semibold text-ink transition-colors hover:border-ink hover:bg-ink hover:text-[#FFFEF6]"
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </section>

      {/* 7. Optional Phone / WhatsApp prompt if missing */}
      {!viewer.phone && (
        <div className="pt-10">
          <AddPhoneCard />
        </div>
      )}
    </div>
  );
}
