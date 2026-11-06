/**
 * Demo dataset — used when DEMO_MODE=true so the UI runs with no database.
 * Times are relative to "now" so the dashboard always looks alive.
 */
import type { Viewer } from "@/lib/rbac";
import { detectClashes, type ExistingEvent } from "@/lib/clash";
import type { DashboardData, EventSummary } from "./types";

export const DEMO_ORGANIZER: Viewer = {
  id: "demo-organizer",
  name: "Aarav Mehta",
  email: "aarav@college.edu",
  role: "ORGANIZER",
  verifiedOrganizer: true,
};

export const DEMO_STUDENT: Viewer = {
  id: "demo-student",
  name: "Diya Sharma",
  email: "diya@college.edu",
  role: "USER",
  verifiedOrganizer: false,
};

const HOUR = 3_600_000;
const at = (hours: number, base = Date.now()) => new Date(Math.round((base + hours * HOUR) / 60_000) * 60_000);
const IST_OFFSET = 5.5 * HOUR;
/** A clock time in IST, `days` from today — keeps demo events at sensible hours. */
function istDay(days: number, hour: number) {
  const ist = new Date(Date.now() + IST_OFFSET);
  const midnightIst = Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate()) - IST_OFFSET;
  return new Date(midnightIst + days * 24 * HOUR + hour * HOUR);
}

type MockEvent = EventSummary & { venueId: string; status: string; mine: boolean; bufferMinutes: number };

function buildEvents(): MockEvent[] {
  const e = (
    id: string,
    title: string,
    tagline: string,
    category: EventSummary["category"],
    venueId: string,
    venueName: string,
    start: number | [days: number, hour: number],
    durH: number,
    capacity: number,
    registered: number,
    feePaise: number,
    accent: string,
    mine: boolean,
    visibility: EventSummary["visibility"] = "PUBLIC",
    bufferMinutes = 30,
  ): MockEvent => ({
    id,
    slug: id,
    title,
    tagline,
    category,
    visibility,
    startsAt: Array.isArray(start) ? istDay(...start) : at(start),
    endsAt: new Date(+(Array.isArray(start) ? istDay(...start) : at(start)) + durH * HOUR),
    venueId,
    venueName,
    capacity,
    registered,
    feePaise,
    accent,
    mine,
    status: "PUBLISHED",
    bufferMinutes,
  });

  return [
    e("hoops-night", "3v3 Hoops Night", "Floodlights on.", "SPORTS", "v-sports", "Sports Complex", -1, 3, 200, 184, 0, "orange", false, "PUBLIC", 15),
    e("valorant", "Valorant Campus Showdown", "5v5. One trophy.", "GAMING", "v-sh2", "Seminar Hall 2", [1, 10], 6, 100, 96, 10000, "red", true),
    e("robowars", "RoboWars 2026", "Metal. Sparks. Glory.", "TECH", "v-oat", "Open Air Theatre", [2, 18], 5, 1200, 842, 0, "blue", true, "PUBLIC", 60),
    e("neon-night", "Neon Night", "The freshers' party you'll actually remember.", "PARTY", "v-audi", "Main Auditorium", [4, 19.5], 4, 700, 611, 29900, "violet", true, "CODE_ONLY"),
    e("ai-talk", "Building with LLMs", "A talk by alumni from Bengaluru startups.", "TALK", "v-sh2", "Seminar Hall 2", [3, 16], 2, 120, 77, 0, "teal", false),
    e("bgmi-cup", "BGMI Squad Cup", "Drop in. Last squad standing.", "GAMING", "v-lab", "Computer Lab 4", [1, 14], 4, 64, 40, 5000, "green", false),
    e("garba", "Garba Night", "Dandiya sticks provided.", "CULTURAL", "v-oat", "Open Air Theatre", [7, 19], 4, 1500, 980, 0, "pink", false, "PUBLIC", 60),
    e("figma-ws", "Figma in 90 Minutes", "Hands-on design workshop.", "WORKSHOP", "v-sh2", "Seminar Hall 2", [5, 11], 1.5, 60, 58, 0, "teal", true),
  ];
}

export function getMockDashboard(viewer: Viewer): DashboardData {
  const events = buildEvents();
  const now = Date.now();
  const mine = events.filter((e) => e.mine && e.endsAt.getTime() > now).sort((a, b) => +a.startsAt - +b.startsAt);
  const campus = events
    .filter((e) => !e.mine && e.visibility === "PUBLIC" && e.endsAt.getTime() > now)
    .sort((a, b) => +a.startsAt - +b.startsAt);

  const first = mine[0];

  // Calendar heat for the current month (IST).
  const calendar: DashboardData["calendar"] = {};
  const ymd = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(d);
  for (const ev of events) {
    const k = ymd(ev.startsAt);
    calendar[k] ??= { campus: 0, mine: 0 };
    calendar[k].campus++;
    if (ev.mine) calendar[k].mine++;
  }

  // Run the real clash detector against two draft events the organizer is planning.
  const existing: ExistingEvent[] = events.map((ev) => ({
    id: ev.id,
    title: ev.title,
    venueId: ev.venueId,
    venueName: ev.venueName,
    startsAt: ev.startsAt,
    endsAt: ev.endsAt,
    status: ev.status,
    category: ev.category,
    capacity: ev.capacity,
    bufferMinutes: ev.bufferMinutes,
  }));
  const neon = events.find((e) => e.id === "neon-night")!;
  const valorant = events.find((e) => e.id === "valorant")!;
  const drafts = [
    { name: "Open Mic Night", venueId: "v-audi", startsAt: new Date(+neon.endsAt + 10 * 60_000), endsAt: new Date(+neon.endsAt + 3 * HOUR), category: "CULTURAL" },
    { name: "Chess Blitz", venueId: "v-library", startsAt: new Date(+valorant.startsAt + HOUR), endsAt: new Date(+valorant.startsAt + 3 * HOUR), category: "GAMING" },
  ];
  const clashes = drafts.flatMap((d) =>
    detectClashes({ venueId: d.venueId, startsAt: d.startsAt, endsAt: d.endsAt, category: d.category }, existing).map(
      (c) => ({ ...c, forEvent: d.name }),
    ),
  );

  const live = events.find((e) => e.id === "hoops-night")!;

  return {
    stats: {
      registered: mine.length,
      thisWeek: mine.filter((e) => +e.startsAt - now < 7 * 24 * HOUR).length,
      certificates: 6,
      photosOfYou: 23,
    },
    nextUp: first
      ? {
          ...first,
          passSerial: "EC-VALO-0042",
          passToken: "EC1.demo-pass-token-not-valid-for-entry",
          paymentStatus: first.feePaise ? "PAID" : "NOT_REQUIRED",
          directions: "CSE Block → lift to 2F → second door on the right.",
        }
      : null,
    upcoming: mine,
    campus,
    announcements: [
      { id: "a1", eventTitle: "Valorant Campus Showdown", kind: "SCHEDULE_CHANGE", title: "Check-in moved to 9:30 AM", body: "Brackets go live 30 minutes earlier. Bring your own headset.", createdAt: at(-0.4) },
      { id: "a2", eventTitle: "RoboWars 2026", kind: "VENUE_CHANGE", title: "Pit area is now behind the OAT", body: "Teams, load-in through Gate 3. Volunteers will guide you.", createdAt: at(-3) },
      { id: "a3", eventTitle: "Neon Night", kind: "INFO", title: "Dress code: anything that glows", body: "UV face paint stall at the entrance. Passes are scanned at the door.", createdAt: at(-20) },
    ],
    certificates: [
      { id: "c1", eventTitle: "HackNight 5.0", serial: "CERT-HN5-0193", issuedAt: at(-24 * 9) },
      { id: "c2", eventTitle: "Photography Walk", serial: "CERT-PW-0058", issuedAt: at(-24 * 21) },
      { id: "c3", eventTitle: "Intro to Arduino", serial: "CERT-ARD-0311", issuedAt: at(-24 * 34) },
    ],
    calendar,
    organizer: viewer.verifiedOrganizer
      ? {
          live: { id: live.id, title: live.title, capacity: live.capacity!, registered: live.registered, checkedIn: 131 },
          hosted: [
            { id: "robowars", title: "RoboWars 2026", startsAt: events[2].startsAt, status: "PUBLISHED", capacity: 1200, registered: 842, checkedIn: 0, paid: 0, pendingPayments: 0, feePaise: 0 },
            { id: "neon-night", title: "Neon Night", startsAt: neon.startsAt, status: "PUBLISHED", capacity: 700, registered: 611, checkedIn: 0, paid: 548, pendingPayments: 63, feePaise: 29900 },
            { id: "valorant", title: "Valorant Campus Showdown", startsAt: valorant.startsAt, status: "PUBLISHED", capacity: 100, registered: 96, checkedIn: 0, paid: 91, pendingPayments: 5, feePaise: 10000 },
          ],
          clashes,
          remindersQueued: 1250,
          whatsappReach: 1384,
        }
      : null,
  };
}
