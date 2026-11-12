import Link from "next/link";
import type { Metadata } from "next";
import { getViewer } from "@/lib/rbac";
import { getDashboardData, getPublicDashboard } from "@/lib/data/dashboard";
import { headers } from "next/headers";
import QRCode from "qrcode";
import { PublicHome } from "@/components/home/PublicHome";
import { LinkButton } from "@/components/ui/Button";
import { AddPhoneCard } from "@/components/profile/AddPhoneCard";
import { MonthCalendar } from "@/components/calendar/MonthCalendar";
import { calendarMonth } from "@/lib/data/calendar";
import { greeting } from "@/lib/greeting";
import { getDB } from "@/lib/db";
import { SavePassButton } from "@/components/passes/SavePassButton";
import {
  Announcements,
  CampusRail,
  EmptyNextUp,
  NextUpHero,
  OrganizerConsole,
  OrgKpis,
  LinkCard,
  SectionHead,
  StatRow,
  UpcomingList,
  UpiPending,
  VaultTeaser,
} from "@/components/dashboard/sections";
import { fmtDate, fmtTime } from "@/lib/utils";
import { TOKENS } from "@/styles/tokens";

export const metadata: Metadata = { title: "Home" };
export const dynamic = "force-dynamic";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const viewer = await getViewer();
  if (!viewer) return <PublicLanding />;
  const [data, params, month] = await Promise.all([getDashboardData(viewer), searchParams, getDB().then((db) => calendarMonth(db, viewer.id))]);
  const firstName = viewer.name.split(" ")[0];

  const summary = [
    data.stats.thisWeek ? `${data.stats.thisWeek} event${data.stats.thisWeek > 1 ? "s" : ""} this week` : "A quiet week",
    data.organizer?.live ? "1 of yours is live right now" : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const passSvg = data.nextUp
    ? await QRCode.toString(data.nextUp.passToken, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: TOKENS.accentInk, light: TOKENS.qrGround } })
    : null;
  let n = 0;
  const num = () => String(++n).padStart(2, "0");

  return (
    <div className="flex flex-col gap-12">
      <header className="flex flex-wrap items-end justify-between gap-6 border-b border-line pb-6 pt-8">
        <div>
          <p className="eyebrow">{new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Kolkata" }).format(new Date())}</p>
          <h1 className="title-xl mt-2">
            {greeting()}, {firstName}
          </h1>
          <p className="mt-2 text-body text-ink-muted">{summary}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <LinkButton href="/passes" variant="secondary">
            My passes
          </LinkButton>
          <LinkButton href="/events" variant="secondary">
            Discover events
          </LinkButton>
        </div>
        {params.denied === "organizer" && <p className="w-full border-l-2 border-warn pl-3 text-body-sm text-ink-muted">That page is only for the event&apos;s organizers.</p>}
      </header>

      {!viewer.phone && <AddPhoneCard />}

      <section>
        <SectionHead n={num()} title="Next up" />
        {data.nextUp ? (
          <NextUpHero
            event={data.nextUp}
            saveButton={
              passSvg && (
                <SavePassButton
                  title={data.nextUp.title}
                  dateLabel={fmtDate(data.nextUp.startsAt, { weekday: "short", day: "numeric", month: "short" })}
                  timeLabel={fmtTime(data.nextUp.startsAt)}
                  venue={data.nextUp.venueName ?? ""}
                  passCode={data.nextUp.passSerial}
                  qrSvg={passSvg}
                />
              )
            }
          />
        ) : (
          <EmptyNextUp />
        )}
        {data.nextUp?.paymentStatus === "PENDING" && (
          <div className="mt-6">
            <UpiPending amountPaise={data.nextUp.feePaise} />
          </div>
        )}
      </section>

      {/* Replaces the old category row: events don't fit fixed genres, but they all fit on a calendar. */}
      <section id="calendar">
        <SectionHead
          n={num()}
          title="Your calendar"
          action={
            <Link href="/calendar" className="inline-flex min-h-6 items-center text-label text-ink-muted underline-offset-4 hover:text-ink hover:underline">
              Full calendar ›
            </Link>
          }
        />
        <MonthCalendar initial={month} signedIn />
      </section>

      <section>
        <SectionHead n={num()} title="Your numbers" />
        <StatRow
          items={[
            { label: "Registered", value: data.stats.registered, hint: "upcoming events", href: "/passes" },
            { label: "This week", value: data.stats.thisWeek, hint: "on your calendar", href: "/calendar" },
            { label: "Attended", value: data.stats.attended, hint: "checked in at the gate", href: "/certificates" },
            { label: "Photos of you", value: data.stats.photosOfYou, hint: "in the vault", href: "/vault" },
          ]}
        />
      </section>

      {data.organizer && (
        <section>
          <SectionHead n={num()} title="Your events" />
          <div className="flex flex-col gap-8">
            <OrgKpis data={data.organizer} />
            <OrganizerConsole data={data.organizer} />
          </div>
        </section>
      )}

      <CampusRail events={data.campus} n={num()} />

      <section>
        <SectionHead n={num()} title="For you" />
        <div className="grid gap-x-12 gap-y-8 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Announcements items={data.announcements} />
          </div>
          <div className="lg:col-span-5">
            <UpcomingList events={data.upcoming} />
          </div>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <VaultTeaser photosOfYou={data.stats.photosOfYou} preview={data.vaultPreview} />
          <LinkCard href="/venues" eyebrow="Venues" title="Find your way" body="Every venue, what's on there next, and directions." />
          <LinkCard
            href="/certificates"
            eyebrow="Certificates"
            title={data.stats.attended ? `${data.stats.attended} earned` : "Proof you were there"}
            body={data.stats.attended ? "One for every event where your pass was scanned. Print or save as PDF." : "Get your pass scanned at an event and your certificate appears here."}
          />
        </div>
      </section>
    </div>
  );
}

/** What a signed-out visitor sees: the cinematic landing page, built from real campus data. */
async function PublicLanding() {
  const [d, month] = await Promise.all([getPublicDashboard(), getDB().then((db) => calendarMonth(db, null))]);
  // The sample OnePass on the landing page carries a real QR: scanning it opens sign-up.
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "evntcult.caliper.workers.dev";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const onePassQr = await QRCode.toString(`${proto}://${host}/signin?mode=signup`, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: TOKENS.accentInk, light: TOKENS.qrGround } });
  return <PublicHome data={{ ...d, onePassQr, month }} />;
}
