import type { Metadata } from "next";
import Link from "next/link";
import { Award, ChevronRight, Images, Plus, Ticket } from "lucide-react";
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

          {/* Quick personal desk */}
          <section aria-labelledby="desk-h">
            <h2 id="desk-h" className="border-b border-ink pb-3 text-[18px] font-semibold text-ink">
              Your desk
            </h2>
            <div className="mt-3 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
              <Link
                href="/passes"
                className="group flex items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-sunken/70"
              >
                <span className="flex items-center gap-3">
                  <span className="grid size-8 place-items-center rounded-xl bg-sunken text-ink">
                    <Ticket className="size-4" aria-hidden />
                  </span>
                  <span>
                    <span className="block text-[14px] font-semibold text-ink">My passes</span>
                    <span className="block text-[12.5px] text-ink-muted">
                      {data.stats.registered > 0 ? `${data.stats.registered} active` : "Gate QR codes & history"}
                    </span>
                  </span>
                </span>
                <ChevronRight className="size-4 text-ink-muted transition-transform group-hover:translate-x-0.5 group-hover:text-ink" aria-hidden />
              </Link>

              <Link
                href="/vault"
                className="group flex items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-sunken/70"
              >
                <span className="flex items-center gap-3">
                  <span className="grid size-8 place-items-center rounded-xl bg-sunken text-ink">
                    <Images className="size-4" aria-hidden />
                  </span>
                  <span>
                    <span className="block text-[14px] font-semibold text-ink">Photo Vault</span>
                    <span className="block text-[12.5px] text-ink-muted">Auto-matched event photos</span>
                  </span>
                </span>
                <ChevronRight className="size-4 text-ink-muted transition-transform group-hover:translate-x-0.5 group-hover:text-ink" aria-hidden />
              </Link>

              <Link
                href="/certificates"
                className="group flex items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-sunken/70"
              >
                <span className="flex items-center gap-3">
                  <span className="grid size-8 place-items-center rounded-xl bg-sunken text-ink">
                    <Award className="size-4" aria-hidden />
                  </span>
                  <span>
                    <span className="block text-[14px] font-semibold text-ink">Certificates</span>
                    <span className="block text-[12.5px] text-ink-muted">Verified participation records</span>
                  </span>
                </span>
                <ChevronRight className="size-4 text-ink-muted transition-transform group-hover:translate-x-0.5 group-hover:text-ink" aria-hidden />
              </Link>

              <Link
                href={viewer.verifiedOrganizer ? "/organizer" : "/host"}
                className="group flex items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-sunken/70"
              >
                <span className="flex items-center gap-3">
                  <span className="grid size-8 place-items-center rounded-xl bg-lavender text-ink ring-1 ring-inset ring-ink/15">
                    <Plus className="size-4" aria-hidden />
                  </span>
                  <span>
                    <span className="block text-[14px] font-semibold text-ink">
                      {viewer.verifiedOrganizer ? "Organizer studio" : "Host an event"}
                    </span>
                    <span className="block text-[12.5px] text-ink-muted">
                      {viewer.verifiedOrganizer ? "Manage tickets & Drive vault" : "0% UPI fee for campus clubs"}
                    </span>
                  </span>
                </span>
                <ChevronRight className="size-4 text-ink-muted transition-transform group-hover:translate-x-0.5 group-hover:text-ink" aria-hidden />
              </Link>
            </div>
          </section>
        </aside>
      </div>

      <Landing data={landing} month={month} isOrganizer={viewer.verifiedOrganizer} app />

      {!viewer.phone && (
        <div className="pt-6">
          <AddPhoneCard />
        </div>
      )}
    </div>
  );
}
