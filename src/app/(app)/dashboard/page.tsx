import type { Metadata } from "next";
import { CalendarCheck2, DoorOpen, Images, Map as MapIcon, Award, Ticket } from "lucide-react";
import { getViewer } from "@/lib/rbac";
import { getDashboardData, getPublicDashboard } from "@/lib/data/dashboard";
import { headers } from "next/headers";
import QRCode from "qrcode";
import { PublicHome } from "@/components/home/PublicHome";
import { LinkButton } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/Section";
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
  LinkCard,
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
  if (!viewer) return <PublicLanding />;
  const [data, params] = await Promise.all([getDashboardData(viewer), searchParams]);
  const firstName = viewer.name.split(" ")[0];

  const summary = [
    data.stats.thisWeek ? `${data.stats.thisWeek} event${data.stats.thisWeek > 1 ? "s" : ""} this week` : "A quiet week",
    data.organizer?.live ? "1 of yours is live right now" : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const today = new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Kolkata" }).format(new Date());

  return (
    <div className="space-y-12 pt-6 md:space-y-16 md:pt-10">
      {/* Greeting */}
      <header className="animate-fade-up">
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-6">
          <div className="min-w-0">
            <p className="eyebrow">{today}</p>
            <h1 className="mt-3 text-display-lg font-semibold">
              {greeting()}, <em>{firstName}.</em>
            </h1>
            <p className="mt-3 flex items-center gap-2 text-lead text-ink-muted">
              {data.organizer?.live && <span className="size-2 rounded-full bg-accent motion-safe:animate-pulse-dot" aria-hidden />}
              {summary}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <LinkButton href="/passes">
              <Ticket className="size-4" aria-hidden /> My passes
            </LinkButton>
            <LinkButton href="/events" variant="secondary">
              Discover events
            </LinkButton>
          </div>
        </div>
        {params.denied === "organizer" && (
          <p role="status" className="mt-6 inline-flex rounded-full bg-warn-soft px-4 py-1.5 text-[13px] font-medium text-warn">
            The organizer console is only for verified organizers.
          </p>
        )}
        <div className="mt-8">
          <QuickTiles />
        </div>
      </header>

      {!viewer.phone && <AddPhoneCard />}

      {/* Next up + pass */}
      <section aria-label="Your next event" className="space-y-3">
        <div className="grid gap-4 lg:grid-cols-12">
          <div className={data.nextUp ? "lg:col-span-8" : "lg:col-span-12"}>{data.nextUp ? <NextUpHero event={data.nextUp} /> : <EmptyNextUp />}</div>
          {data.nextUp && (
            <div className="lg:col-span-4">
              <PassCard pass={data.nextUp} />
            </div>
          )}
        </div>
        {data.nextUp?.paymentStatus === "PENDING" && <UpiPending amountPaise={data.nextUp.feePaise} />}
      </section>

      {/* Stats */}
      <section aria-label="Your numbers" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Registered" value={data.stats.registered} hint="Upcoming events" icon={Ticket} href="/passes" />
        <StatTile label="This week" value={data.stats.thisWeek} hint="On your calendar" icon={CalendarCheck2} href="/calendar" />
        <StatTile label="Attended" value={data.stats.attended} hint="Checked in at the gate" icon={DoorOpen} href="/certificates" />
        <StatTile label="Photos of you" value={data.stats.photosOfYou} hint="In the vault" icon={Images} href="/vault" />
      </section>

      {/* Organizer console */}
      {data.organizer && (
        <section aria-labelledby="org-heading" className="space-y-6">
          <SectionHeader
            id="org-heading"
            eyebrow="Organizer"
            title={
              <>
                Your events, at a <em>glance.</em>
              </>
            }
            actions={
              <LinkButton href="/organizer" variant="secondary" size="sm">
                Open console
              </LinkButton>
            }
          />
          <OrgKpis data={data.organizer} />
          <OrganizerConsole data={data.organizer} />
        </section>
      )}

      {/* Campus events */}
      <CampusRail events={data.campus} />

      {/* Personal */}
      <section aria-label="Updates and calendar" className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Announcements items={data.announcements} />
        </div>
        <div className="lg:col-span-4">
          <UpcomingList events={data.upcoming} />
        </div>
        <div className="card p-5 md:p-6 lg:col-span-3">
          <MiniCalendar data={data.calendar} />
        </div>
      </section>

      <section aria-label="More" className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <VaultTeaser photosOfYou={data.stats.photosOfYou} preview={data.vaultPreview} />
        <LinkCard href="/venues" eyebrow="Venues" title="Find your way" icon={MapIcon} body="Every venue, what's on there next, and directions." />
        <LinkCard
          href="/certificates"
          eyebrow="Certificates"
          title={data.stats.attended ? `${data.stats.attended} earned` : "Proof you were there"}
          icon={Award}
          body={data.stats.attended ? "One for every event where your pass was scanned. Print or save as PDF." : "Get your pass scanned at an event and your certificate appears here."}
        />
      </section>
    </div>
  );
}

/** What a signed-out visitor sees: the cinematic landing page, built from real campus data. */
async function PublicLanding() {
  const d = await getPublicDashboard();
  // The sample OnePass on the landing page carries a real QR: scanning it opens sign-up.
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "evntcult.caliper.workers.dev";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const onePassQr = await QRCode.toString(`${proto}://${host}/signin?mode=signup`, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#111110", light: "#ffffff" } });
  return <PublicHome data={{ ...d, onePassQr }} />;
}
