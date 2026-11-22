import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getViewer } from "@/lib/rbac";
import { getDashboardData } from "@/lib/data/dashboard";
import { getLandingData } from "@/lib/data/landing";
import { Landing, PublicHome } from "@/components/landing/Landing";
import { getDB } from "@/lib/db";
import { calendarMonth } from "@/lib/data/calendar";
import { AddPhoneCard } from "@/components/profile/AddPhoneCard";
import { Agenda, UpdatesFeed, weekItems } from "@/components/dashboard/Agenda";
import { HomeHero } from "@/components/dashboard/HomeHero";

export const metadata: Metadata = { title: "Home" };
export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ denied?: string }>;
}) {
  const viewer = await getViewer();
  // Visitors get the public homepage only: no event data is loaded for them at all.
  if (!viewer) return <PublicHome />;
  const [landing, month] = await Promise.all([getLandingData({ withPeople: true }), getDB().then((db) => calendarMonth(db, viewer.id))]);

  const [data, params] = await Promise.all([
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

  return (
    <div>
      <HomeHero
        name={viewer.name}
        mine={!!next}
        dateLine={new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", weekday: "long", day: "numeric", month: "long" }).format(new Date())}
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
      {params.denied === "organizer" && (
        <p role="status" className="mt-6 rounded-lg bg-warn-soft px-4 py-3 text-[14px] font-medium text-warn">
          Hosting is only for verified organizers.
        </p>
      )}

      <div className="grid items-start gap-x-14 gap-y-12 pt-10 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <Agenda items={week.all.filter((e) => e.id !== hero?.id)} next={null} later={data.campus.filter((e) => e.id !== hero?.id && !week.rest.some((r) => r.id === e.id))} />

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
          {data.stats.registered > 0 && (
            <Link href="/passes" className="group -mt-4 flex min-h-11 items-center justify-between border-b border-line pb-3 text-[15px] font-semibold text-ink">
              {data.stats.registered === 1 ? "Your pass" : `All ${data.stats.registered} passes`}
              <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>
          )}
        </aside>
      </div>

      <Landing data={landing} month={month} isOrganizer={viewer.verifiedOrganizer} />

      {!viewer.phone && (
        <div className="pt-6">
          <AddPhoneCard />
        </div>
      )}
    </div>
  );
}
