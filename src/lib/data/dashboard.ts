import "server-only";
import { Prisma, type EventStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isDemoMode } from "@/lib/env";
import type { Viewer } from "@/lib/rbac";
import { detectClashes } from "@/lib/clash";
import { getMockDashboard } from "./mock";
import type { DashboardData, EventSummary } from "./types";

const DAY = 86_400_000;
const ACCENTS = ["blue", "violet", "orange", "teal", "pink", "green", "red"];
const accentFor = (id: string) => ACCENTS[[...id].reduce((s, c) => s + c.charCodeAt(0), 0) % ACCENTS.length];

const eventSelect = {
  id: true,
  slug: true,
  title: true,
  tagline: true,
  category: true,
  visibility: true,
  startsAt: true,
  endsAt: true,
  capacity: true,
  feeAmountPaise: true,
  accentColor: true,
  venue: { select: { name: true, directions: true } },
  venueOverride: true,
  _count: { select: { registrations: { where: { status: { in: ["REGISTERED", "ATTENDED"] } } } } },
} satisfies Prisma.EventSelect;

type EventRow = Prisma.EventGetPayload<{ select: typeof eventSelect }>;
const loadEvents = (args: Omit<Prisma.EventFindManyArgs, "select" | "include">) =>
  prisma.event.findMany({ ...args, select: eventSelect });

function toSummary(e: EventRow): EventSummary {
  return {
    id: e.id,
    slug: e.slug,
    title: e.title,
    tagline: e.tagline,
    category: e.category,
    visibility: e.visibility,
    startsAt: e.startsAt,
    endsAt: e.endsAt,
    venueName: e.venue?.name ?? e.venueOverride ?? null,
    capacity: e.capacity,
    registered: e._count.registrations,
    feePaise: e.feeAmountPaise,
    accent: e.accentColor ?? accentFor(e.id),
  };
}

export async function getDashboardData(viewer: Viewer): Promise<DashboardData> {
  if (isDemoMode()) return getMockDashboard(viewer);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const live = { status: { in: ["PUBLISHED", "LIVE"] as EventStatus[] } };

  const [myRegs, campusRows, announcements, certificates, photosOfYou, monthEvents] = await Promise.all([
    prisma.registration.findMany({
      where: { userId: viewer.id, status: "REGISTERED", event: { endsAt: { gt: now }, ...live } },
      select: {
        eventId: true,
        pass: { select: { serial: true, token: true, revokedAt: true } },
        payment: { select: { status: true } },
      },
    }),
    loadEvents({
      where: { ...live, visibility: "PUBLIC", endsAt: { gt: now }, registrations: { none: { userId: viewer.id } } },
      orderBy: { startsAt: "asc" },
      take: 8,
    }),
    prisma.announcement.findMany({
      where: { event: { registrations: { some: { userId: viewer.id, status: "REGISTERED" } } } },
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      take: 5,
      select: { id: true, kind: true, title: true, body: true, createdAt: true, event: { select: { title: true } } },
    }),
    prisma.certificate.findMany({
      where: { registration: { userId: viewer.id } },
      orderBy: { issuedAt: "desc" },
      take: 5,
      select: { id: true, serial: true, issuedAt: true, registration: { select: { event: { select: { title: true } } } } },
    }),
    prisma.photoMatch.count({ where: { userId: viewer.id, hiddenByUser: false, confirmed: { not: false } } }),
    prisma.event.findMany({
      where: {
        ...live,
        startsAt: { gte: monthStart, lt: monthEnd },
        OR: [{ visibility: "PUBLIC" }, { registrations: { some: { userId: viewer.id } } }],
      },
      select: { startsAt: true, registrations: { where: { userId: viewer.id }, select: { id: true } } },
    }),
  ]);

  const myEventRows = await loadEvents({
    where: { id: { in: myRegs.map((r) => r.eventId) } },
    orderBy: { startsAt: "asc" },
  });
  const upcoming = myEventRows.map(toSummary);
  const regByEvent = new Map(myRegs.map((r) => [r.eventId, r]));

  const firstRow = myEventRows[0];
  const firstReg = firstRow && regByEvent.get(firstRow.id);
  const nextUp =
    firstRow && firstReg?.pass && !firstReg.pass.revokedAt
      ? {
          ...toSummary(firstRow),
          passSerial: firstReg.pass.serial,
          passToken: firstReg.pass.token,
          paymentStatus: firstReg.payment?.status ?? ("NOT_REQUIRED" as const),
          directions: firstRow.venue?.directions,
        }
      : null;

  const calendar: DashboardData["calendar"] = {};
  const ymd = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(d);
  for (const ev of monthEvents) {
    const k = ymd(ev.startsAt);
    calendar[k] ??= { campus: 0, mine: 0 };
    calendar[k].campus++;
    if (ev.registrations.length) calendar[k].mine++;
  }

  return {
    stats: {
      registered: upcoming.length,
      thisWeek: upcoming.filter((e) => +e.startsAt - +now < 7 * DAY).length,
      certificates: certificates.length,
      photosOfYou,
    },
    nextUp,
    upcoming,
    campus: campusRows.map(toSummary),
    announcements: announcements.map((a) => ({ ...a, eventTitle: a.event.title })),
    certificates: certificates.map((c) => ({
      id: c.id,
      serial: c.serial,
      issuedAt: c.issuedAt,
      eventTitle: c.registration.event.title,
    })),
    calendar,
    organizer: viewer.verifiedOrganizer ? await getOrganizerPanel(viewer, now) : null,
  };
}

async function getOrganizerPanel(viewer: Viewer, now: Date): Promise<DashboardData["organizer"]> {
  const hostedWhere =
    viewer.role === "ADMIN"
      ? {}
      : { OR: [{ hostId: viewer.id }, { team: { some: { userId: viewer.id } } }] };

  const hosted = await prisma.event.findMany({
    where: { ...hostedWhere, endsAt: { gt: new Date(+now - DAY) }, status: { not: "CANCELLED" } },
    orderBy: { startsAt: "asc" },
    take: 6,
    select: {
      id: true,
      title: true,
      startsAt: true,
      endsAt: true,
      status: true,
      capacity: true,
      feeAmountPaise: true,
      venueId: true,
      category: true,
    },
  });
  const ids = hosted.map((h) => h.id);

  const [regCounts, checkInCounts, paymentCounts, remindersQueued, whatsappReach] = await Promise.all([
    prisma.registration.groupBy({ by: ["eventId"], where: { eventId: { in: ids }, status: { in: ["REGISTERED", "ATTENDED"] } }, _count: true }),
    prisma.registration.groupBy({ by: ["eventId"], where: { eventId: { in: ids }, pass: { checkIns: { some: { direction: "IN" } } } }, _count: true }),
    prisma.payment.findMany({ where: { registration: { eventId: { in: ids } } }, select: { status: true, registration: { select: { eventId: true } } } }),
    prisma.reminder.count({ where: { eventId: { in: ids }, status: "QUEUED" } }),
    prisma.user.count({ where: { whatsappOptIn: true, registrations: { some: { eventId: { in: ids }, status: "REGISTERED" } } } }),
  ]);

  const count = (rows: { eventId: string; _count: number }[], id: string) => rows.find((r) => r.eventId === id)?._count ?? 0;
  const pay = (id: string, s: string) => paymentCounts.filter((p) => p.registration.eventId === id && p.status === s).length;

  const rows = hosted.map((h) => ({
    id: h.id,
    title: h.title,
    startsAt: h.startsAt,
    status: h.status,
    capacity: h.capacity,
    registered: count(regCounts, h.id),
    checkedIn: count(checkInCounts, h.id),
    paid: pay(h.id, "PAID"),
    pendingPayments: pay(h.id, "PENDING"),
    feePaise: h.feeAmountPaise,
  }));

  const liveEv = hosted.find((h) => h.startsAt <= now && h.endsAt > now);
  const liveRow = liveEv && rows.find((r) => r.id === liveEv.id);

  // Re-check every DRAFT the organizer has against the published calendar.
  const drafts = hosted.filter((h) => h.status === "DRAFT");
  let clashes: NonNullable<DashboardData["organizer"]>["clashes"] = [];
  if (drafts.length) {
    const minStart = new Date(Math.min(...drafts.map((d) => +d.startsAt)) - DAY);
    const maxEnd = new Date(Math.max(...drafts.map((d) => +d.endsAt)) + DAY);
    const existing = await prisma.event.findMany({
      where: { status: { in: ["PUBLISHED", "LIVE"] }, startsAt: { lt: maxEnd }, endsAt: { gt: minStart } },
      select: { id: true, title: true, venueId: true, startsAt: true, endsAt: true, status: true, category: true, capacity: true, venue: { select: { name: true, bufferMinutes: true } } },
    });
    const ex = existing.map((e) => ({ ...e, venueName: e.venue?.name, bufferMinutes: e.venue?.bufferMinutes }));
    clashes = drafts.flatMap((d) =>
      detectClashes({ id: d.id, venueId: d.venueId, startsAt: d.startsAt, endsAt: d.endsAt, category: d.category }, ex).map(
        (c) => ({ ...c, forEvent: d.title }),
      ),
    );
  }

  return {
    live: liveRow
      ? { id: liveRow.id, title: liveRow.title, capacity: liveRow.capacity ?? liveRow.registered, registered: liveRow.registered, checkedIn: liveRow.checkedIn }
      : null,
    hosted: rows,
    clashes,
    remindersQueued,
    whatsappReach,
  };
}
