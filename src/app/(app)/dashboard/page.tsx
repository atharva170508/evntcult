import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, MapPin } from "lucide-react";
import { getViewer } from "@/lib/rbac";
import { getDashboardData } from "@/lib/data/dashboard";
import { getLandingData } from "@/lib/data/landing";
import { Landing } from "@/components/landing/Landing";
import { EventArt } from "@/components/ui/EventArt";
import { AddPhoneCard } from "@/components/profile/AddPhoneCard";
import { UpiPending } from "@/components/dashboard/sections";
import { fmtDate, fmtTime, relative } from "@/lib/utils";

export const metadata: Metadata = { title: "Home" };
export const dynamic = "force-dynamic";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const viewer = await getViewer();
  const landing = await getLandingData();
  if (!viewer) return <Landing data={landing} />;

  const [data, params] = await Promise.all([getDashboardData(viewer), searchParams]);
  const next = data.nextUp;
  const live = data.organizer?.live;

  return (
    <div>
      {params.denied === "organizer" && (
        <p role="status" className="mt-6 rounded-lg bg-warn-soft px-4 py-3 text-[14px] font-medium text-warn">
          Hosting is only for verified organizers.
        </p>
      )}

      {(next || live || data.announcements.length > 0) && (
        <section aria-label="Yours" className="grid gap-4 pt-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          {next ? (
            <Link href="/passes" className="group flex overflow-hidden rounded-[20px] border border-line-strong bg-white transition-shadow hover:shadow-raised">
              <div className="relative w-[38%] shrink-0 overflow-hidden sm:w-[42%]">
                <EventArt accent={next.accent} seed={next.id} scrim={false} className="transition-transform duration-500 group-hover:scale-[1.04]" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col p-5 sm:p-6">
                <p className="text-[13px] font-semibold text-accent">Your next event · {relative(next.startsAt)}</p>
                <h2 className="mt-1.5 line-clamp-2 text-[20px] font-semibold leading-snug text-ink sm:text-[22px]">{next.title}</h2>
                <p className="mt-2 text-[14px] text-ink-muted">
                  {fmtDate(next.startsAt, { weekday: "long", day: "numeric", month: "long" })} · {fmtTime(next.startsAt)}
                </p>
                <p className="flex items-center gap-1 text-[14px] text-ink-muted">
                  <MapPin className="size-3.5" aria-hidden /> {next.venueName ?? "Venue TBA"}
                </p>
                <div className="mt-auto flex flex-wrap items-center gap-2 pt-5">
                  <span className="inline-flex h-10 items-center rounded-lg bg-ink px-4 text-[14px] font-semibold text-white">Show pass</span>
                  <span className="font-mono text-[13px] text-ink-muted">{next.passSerial}</span>
                </div>
                {next.paymentStatus === "PENDING" && (
                  <div className="mt-4">
                    <UpiPending amountPaise={next.feePaise} />
                  </div>
                )}
              </div>
            </Link>
          ) : (
            <Link href="/events" className="flex items-center justify-between rounded-[20px] border border-line-strong bg-white p-6 transition-shadow hover:shadow-raised">
              <span>
                <span className="block text-[20px] font-semibold text-ink">No upcoming passes</span>
                <span className="mt-1 block text-[14px] text-ink-muted">Find something below.</span>
              </span>
              <ChevronRight className="size-5 text-ink" aria-hidden />
            </Link>
          )}

          <div className="flex flex-col gap-4">
            {live && (
              <Link href={`/organizer/events/${live.id}/manage`} className="flex items-center gap-4 rounded-[20px] bg-ink p-5 text-white transition-opacity hover:opacity-95">
                <span className="relative flex size-2.5 shrink-0">
                  <span className="absolute inset-0 rounded-full bg-accent motion-safe:animate-ping" />
                  <span className="relative size-2.5 rounded-full bg-accent" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[16px] font-semibold">{live.title}</span>
                  <span className="block text-[13.5px] text-white/70">
                    Live · {live.checkedIn} checked in of {live.registered}
                  </span>
                </span>
                <ChevronRight className="size-5 shrink-0" aria-hidden />
              </Link>
            )}
            {data.announcements.length > 0 && (
              <div className="flex-1 rounded-[20px] border border-line-strong p-5">
                <h2 className="text-[16px] font-semibold text-ink">Updates</h2>
                <ul className="mt-2 divide-y divide-line">
                  {data.announcements.slice(0, 3).map((a) => (
                    <li key={a.id} className="py-3">
                      <p className="text-[14px] font-semibold text-ink">
                        {a.title} <span className="font-normal text-ink-muted">· {a.eventTitle}</span>
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-[14px] text-ink-2">{a.body}</p>
                      <p className="mt-1 text-[12.5px] text-ink-subtle">{relative(a.createdAt)}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {!live && data.announcements.length === 0 && data.stats.registered > 1 && (
              <Link href="/passes" className="flex items-center justify-between rounded-[20px] border border-line-strong p-5 transition-shadow hover:shadow-raised">
                <span className="text-[16px] font-semibold text-ink">All {data.stats.registered} passes</span>
                <ChevronRight className="size-5" aria-hidden />
              </Link>
            )}
          </div>
        </section>
      )}

      <Landing data={landing} signedIn isOrganizer={viewer.verifiedOrganizer} />

      {!viewer.phone && (
        <div className="pt-6">
          <AddPhoneCard />
        </div>
      )}
    </div>
  );
}
