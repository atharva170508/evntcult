import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Entrance } from "@/components/motion/MaskedLines";
import { getViewer } from "@/lib/rbac";
import { getDashboardData } from "@/lib/data/dashboard";
import { getLandingData } from "@/lib/data/landing";
import { Landing, PublicHome } from "@/components/landing/Landing";
import { getDB } from "@/lib/db";
import { calendarMonth } from "@/lib/data/calendar";
import { AddPhoneCard } from "@/components/profile/AddPhoneCard";
import { AlsoOn, FirstPass, NextPass, TodayLine, Updates, WeekStrip } from "@/components/dashboard/Today";

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

  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata",
      hour: "numeric",
      hour12: false,
    }).format(new Date()),
  );
  const greeting =
    hour < 5
      ? "Up late"
      : hour < 12
        ? "Good morning"
        : hour < 17
          ? "Good afternoon"
          : "Good evening";
  const firstName = viewer.name.split(/\s+/)[0] || "there";

  return (
    <div>
      <Entrance delay={0.02} className="pt-8 md:pt-10">
        <h1 className="font-display text-[clamp(40px,5vw,60px)] leading-none tracking-[-0.03em] text-ink">
          {greeting}, <em>{firstName}.</em>
        </h1>
        <TodayLine calendar={data.calendar} />
      </Entrance>
      {params.denied === "organizer" && (
        <p
          role="status"
          className="mt-6 rounded-lg bg-warn-soft px-4 py-3 text-[14px] font-medium text-warn"
        >
          Hosting is only for verified organizers.
        </p>
      )}

      <div className="grid items-start gap-4 pt-7 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
        {next ? (
          <div className="flex flex-col gap-4">
            <NextPass next={next} />
            <AlsoOn campus={data.campus} />
          </div>
        ) : (
          <FirstPass campus={data.campus} />
        )}

        <div className="flex flex-col gap-4">
          {live && (
            <Link
              href={`/organizer/events/${live.id}/manage`}
              className="flex items-center gap-4 rounded-[20px] bg-ink p-5 text-white transition-colors duration-fast hover:bg-night-2"
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
          <WeekStrip calendar={data.calendar} />
          <Updates items={data.announcements} />
          {data.stats.registered > 1 && (
            <Link
              href="/passes"
              className="flex min-h-11 items-center justify-between rounded-[20px] border border-line-strong bg-white px-5 py-4 transition-shadow duration-fast hover:shadow-raised"
            >
              <span className="text-[15px] font-semibold text-ink">All {data.stats.registered} passes</span>
              <ChevronRight className="size-5" aria-hidden />
            </Link>
          )}
        </div>
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
