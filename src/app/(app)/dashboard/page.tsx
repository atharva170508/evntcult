import type { Metadata } from "next";
import { CalendarCheck2, DoorOpen, Images, Map as MapIcon, Award, Ticket } from "lucide-react";
import { getViewer } from "@/lib/rbac";
import { getDashboardData, getPublicDashboard } from "@/lib/data/dashboard";
import { headers } from "next/headers";
import QRCode from "qrcode";
import { PublicHome } from "@/components/home/PublicHome";
import { Aurora } from "@/components/brand/Aurora";
import { Marquee } from "@/components/brand/Marquee";
import { LinkButton } from "@/components/ui/Button";
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
import { TOKENS } from "@/styles/tokens";

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

  return (
    <div className="space-y-6">
      {/* Greeting: cinematic band with huge editorial serif */}
      <header className="relative isolate mt-3 overflow-hidden rounded-lg px-6 py-12 md:px-12 md:py-16">
        <Aurora quiet />
        <Marquee words={["Tonight near you", "Your passes", "Live at the gate"]} className="absolute inset-x-0 bottom-3 text-display text-white/[0.04]" />
        <div className="relative">
          <p className="eyebrow text-ink-2">{new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Kolkata" }).format(new Date())}</p>
          <h1 className="title-xl mt-3 text-display">
            {greeting()}, <em className="text-volt">{firstName}</em>
          </h1>
          <p className="mt-3 text-body font-medium text-ink-2">{summary}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <LinkButton href="/passes" variant="volt">My passes</LinkButton>
            <LinkButton href="/events" variant="glass">Discover events</LinkButton>
          </div>
          {params.denied === "organizer" && (
            <p className="mt-4 inline-block rounded-full bg-warn-soft px-4 py-2 text-body-sm font-semibold text-warn">
              The organizer console is only for verified organizers.
            </p>
          )}
        </div>
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
        <StatTile label="Registered" value={data.stats.registered} hint="upcoming events" icon={Ticket} delay={60} />
        <StatTile label="This week" value={data.stats.thisWeek} hint="on your calendar" icon={CalendarCheck2} delay={110} />
        <StatTile label="Attended" value={data.stats.attended} hint="checked in at the gate" icon={DoorOpen} delay={160} />
        <StatTile label="Photos of you" value={data.stats.photosOfYou} hint="in the vault" icon={Images} delay={210} />
      </div>

      {/* Organizer console */}
      {data.organizer && (
        <section className="space-y-4 pt-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="eyebrow">Organizer</p>
              <h2 className="title-xl mt-2 text-display">Your events, <em className="text-volt">at a glance</em></h2>
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
        <div className="card p-6 lg:col-span-3">
          <MiniCalendar data={data.calendar} />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
  const onePassQr = await QRCode.toString(`${proto}://${host}/signin?mode=signup`, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: TOKENS.accentInk, light: TOKENS.qrGround } });
  return <PublicHome data={{ ...d, onePassQr }} />;
}
