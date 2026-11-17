import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, MapPin, Ticket } from "lucide-react";
import { Entrance } from "@/components/motion/MaskedLines";
import { getViewer } from "@/lib/rbac";
import { getDashboardData } from "@/lib/data/dashboard";
import { getLandingData } from "@/lib/data/landing";
import { Landing } from "@/components/landing/Landing";
import { getDB } from "@/lib/db";
import { calendarMonth } from "@/lib/data/calendar";
import { EventArt } from "@/components/ui/EventArt";
import { AddPhoneCard } from "@/components/profile/AddPhoneCard";
import { UpiPending } from "@/components/dashboard/sections";
import { fmtDate, fmtTime, relative } from "@/lib/utils";

export const metadata: Metadata = { title: "Home" };
export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ denied?: string }>;
}) {
  const viewer = await getViewer();
  const [landing, month] = await Promise.all([getLandingData(), getDB().then((db) => calendarMonth(db, viewer?.id ?? null))]);
  if (!viewer) return <Landing data={landing} month={month} />;

  const [data, params] = await Promise.all([
    getDashboardData(viewer),
    searchParams,
  ]);
  const next = data.nextUp;
  const live = data.organizer?.live;

  const hasSide =
    !!live || data.announcements.length > 0 || data.stats.registered > 1;
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
      </Entrance>
      {params.denied === "organizer" && (
        <p
          role="status"
          className="mt-6 rounded-lg bg-warn-soft px-4 py-3 text-[14px] font-medium text-warn"
        >
          Hosting is only for verified organizers.
        </p>
      )}

      <section
        aria-label="Yours"
        className={`grid gap-4 pt-6 ${hasSide ? "lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]" : ""}`}
      >
        {next ? (
          <Link
            href="/passes"
            className="group flex overflow-hidden rounded-[20px] border border-line-strong bg-white transition-shadow hover:shadow-raised"
          >
            <div className="relative w-[38%] shrink-0 overflow-hidden sm:w-[42%]">
              <EventArt
                accent={next.accent}
                seed={next.id}
                scrim={false}
                className="transition-transform duration-500"
              />
            </div>
            <div className="flex min-w-0 flex-1 flex-col p-5 sm:p-6">
              <p className="text-[13px] font-semibold text-accent">
                Your next event · {relative(next.startsAt)}
              </p>
              <h2 className="mt-1.5 line-clamp-2 text-[20px] font-semibold leading-snug text-ink sm:text-[22px]">
                {next.title}
              </h2>
              <p className="mt-2 text-[14px] text-ink-muted">
                {fmtDate(next.startsAt, {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}{" "}
                · {fmtTime(next.startsAt)}
              </p>
              <p className="flex items-center gap-1 text-[14px] text-ink-muted">
                <MapPin className="size-3.5" aria-hidden />{" "}
                {next.venueName ?? "Venue TBA"}
              </p>
              <div className="mt-auto flex flex-wrap items-center gap-2 pt-5">
                <span className="inline-flex h-10 items-center rounded-lg bg-ink px-4 text-[14px] font-semibold text-white">
                  Show pass
                </span>
                <span className="font-mono text-[13px] text-ink-muted">
                  {next.passSerial}
                </span>
              </div>
              {next.paymentStatus === "PENDING" && (
                <div className="mt-4">
                  <UpiPending amountPaise={next.feePaise} />
                </div>
              )}
            </div>
          </Link>
        ) : (
          <div className="grid overflow-hidden rounded-[20px] border border-line-strong bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] sm:grid-cols-[180px_1fr]">
            <div className="relative grid min-h-[120px] place-items-center">
              <EventArt accent="violet" seed="no-pass" flat scrim={false} />
              <Ticket
                className="relative size-10 -rotate-12 text-white/90"
                strokeWidth={1.5}
                aria-hidden
              />
            </div>
            <div className="p-6">
              <h2 className="font-display text-[34px] leading-none tracking-[-0.02em] text-ink">
                No passes <em>yet.</em>
              </h2>
              <p className="mt-2 text-[15px] text-ink-2">
                Register for an event and its pass appears here.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
                <Link
                  href="/events"
                  className="inline-flex h-11 items-center rounded-xl bg-lavender px-5 text-[15px] font-semibold text-ink ring-2 ring-inset ring-ink transition-colors duration-fast hover:bg-lavender-hover"
                >
                  Browse events
                </Link>
                <Link
                  href="/calendar"
                  className="text-[15px] font-semibold text-ink underline decoration-line-strong decoration-2 underline-offset-[5px] hover:decoration-ink"
                >
                  Open the calendar
                </Link>
              </div>
            </div>
          </div>
        )}

        {hasSide && (
          <div className="flex flex-col gap-4">
            {live && (
              <Link
                href={`/organizer/events/${live.id}/manage`}
                className="flex items-center gap-4 rounded-[20px] bg-ink p-5 text-white transition-opacity hover:opacity-95"
              >
                <span className="relative flex size-2.5 shrink-0">
                  <span className="absolute inset-0 rounded-full bg-accent motion-safe:animate-ping" />
                  <span className="relative size-2.5 rounded-full bg-accent" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[16px] font-semibold">
                    {live.title}
                  </span>
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
                        {a.title}{" "}
                        <span className="font-normal text-ink-muted">
                          · {a.eventTitle}
                        </span>
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-[14px] text-ink-2">
                        {a.body}
                      </p>
                      <p className="mt-1 text-[12.5px] text-ink-subtle">
                        {relative(a.createdAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {!live &&
              data.announcements.length === 0 &&
              data.stats.registered > 1 && (
                <Link
                  href="/passes"
                  className="flex items-center justify-between rounded-[20px] border border-line-strong p-5 transition-shadow hover:shadow-raised"
                >
                  <span className="text-[16px] font-semibold text-ink">
                    All {data.stats.registered} passes
                  </span>
                  <ChevronRight className="size-5" aria-hidden />
                </Link>
              )}
          </div>
        )}
      </section>

      <Landing data={landing} month={month} signedIn isOrganizer={viewer.verifiedOrganizer} />

      {!viewer.phone && (
        <div className="pt-6">
          <AddPhoneCard />
        </div>
      )}
    </div>
  );
}
