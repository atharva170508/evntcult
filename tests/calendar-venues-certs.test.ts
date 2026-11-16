/** M8: calendar visibility, venue schedule, directions links and certificates (real local D1). */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { testDatabase } from "./helpers/d1";
import { monthEvents, monthGrid, monthRange } from "@/lib/data/calendar";
import { upcomingByVenue } from "@/lib/data/venue-schedule";
import { certificateFor, myCertificates } from "@/lib/data/certificates";
import { directionsUrl } from "@/lib/venues";

let db: D1Database;
let dispose: () => Promise<void>;
const at = "2026-11-01T00:00:00.000Z";
const NOW = new Date("2026-11-15T06:30:00.000Z"); // 12:00 IST

beforeAll(async () => {
  ({ db, dispose } = await testDatabase());
  const users = [
    ["org", "Organizer One", "organizer"],
    ["stu", "Asha Rao", "attendee"],
    ["other", "Bilal Khan", "attendee"],
    ["adm", "Admin", "admin"],
  ];
  await db.batch(users.map(([id, name, role]) => db.prepare("INSERT INTO users (id, email, name, role, created_at) VALUES (?, ?, ?, ?, ?)").bind(id, `${id}@college.edu`, name, role, at)));
  const ev = (id: string, title: string, start: string, end: string, status: string, access: string, venue = "Seminar Hall 2") =>
    db
      .prepare(
        `INSERT INTO events (id, slug, title, category, venue, starts_at, ends_at, capacity, price_paise, status, access, access_code, organizer_id, created_at)
         VALUES (?, ?, ?, 'TECH', ?, ?, ?, 50, 0, ?, ?, ?, 'org', ?)`,
      )
      .bind(id, id, title, venue, start, end, status, access, access === 'code' ? `CODE${id}` : null, at);
  await db.batch([
    ev("pub", "Public Talk", "2026-11-20T12:30:00.000Z", "2026-11-20T14:30:00.000Z", "published", "public"),
    ev("priv", "Private Jam", "2026-11-21T12:30:00.000Z", "2026-11-21T14:30:00.000Z", "published", "code"),
    ev("draft", "Draft Idea", "2026-11-22T12:30:00.000Z", "2026-11-22T14:30:00.000Z", "draft", "public"),
    ev("gone", "Cancelled Fest", "2026-11-23T12:30:00.000Z", "2026-11-23T14:30:00.000Z", "cancelled", "public"),
    // 30 Nov 19:00 UTC = 1 Dec 00:30 IST: belongs to December in IST.
    ev("edge", "Midnight Run", "2026-11-30T19:00:00.000Z", "2026-11-30T21:00:00.000Z", "published", "public", "Sports Complex"),
    ev("past", "Old Workshop", "2026-11-05T08:30:00.000Z", "2026-11-05T10:30:00.000Z", "published", "public"),
  ]);
  const reg = (id: string, user: string, event: string, status = "registered") =>
    db
      .prepare("INSERT INTO registrations (id, event_id, user_id, status, pass_code, pass_token, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .bind(id, event, user, status, `EC-${id.toUpperCase()}`, `TOKEN${id.toUpperCase()}`, at);
  await db.batch([reg("r1", "stu", "priv"), reg("r2", "stu", "gone"), reg("r3", "stu", "past"), reg("r4", "other", "past")]);
  await db.prepare("INSERT INTO checkins (id, registration_id, event_id, scanned_at) VALUES ('c1', 'r3', 'past', '2026-11-05T08:40:00.000Z')").run();
}, 60_000);
afterAll(async () => dispose?.());

describe("calendar", () => {
  const nov = monthRange("2026-11");

  it("month range uses IST midnights", () => {
    expect(nov.start.toISOString()).toBe("2026-10-31T18:30:00.000Z");
    expect(nov.end.toISOString()).toBe("2026-11-30T18:30:00.000Z");
    expect([nov.prev, nov.next]).toEqual(["2026-10", "2026-12"]);
    expect(monthRange("2026-13", NOW).key).toBe("2026-11"); // bad input -> current month
    expect(monthRange("2026-12").next).toBe("2027-01");
  });

  it("signed-out visitors see only published public events in that IST month", async () => {
    const titles = (await monthEvents(db, { viewerId: null, ...nov })).map((e) => e.title);
    expect(titles).toEqual(["Old Workshop", "Public Talk"]);
  });

  it("a student also sees their private and cancelled registrations, flagged as theirs", async () => {
    const evs = await monthEvents(db, { viewerId: "stu", ...nov });
    expect(evs.map((e) => e.title)).toEqual(["Old Workshop", "Public Talk", "Private Jam", "Cancelled Fest"]);
    expect(evs.find((e) => e.id === "priv")?.mine).toBe("registered");
    expect(evs.find((e) => e.id === "pub")?.mine).toBeNull();
    expect((await monthEvents(db, { viewerId: "stu", ...nov, onlyMine: true })).map((e) => e.id)).toEqual(["past", "priv", "gone"]);
  });

  it("an organizer sees their own drafts, but never their cancelled events unless registered", async () => {
    const evs = await monthEvents(db, { viewerId: "org", ...nov });
    expect(evs.find((e) => e.id === "draft")?.hosting).toBe(true);
    expect(evs.some((e) => e.id === "gone")).toBe(false);
  });

  it("another student can't see the private event", async () => {
    expect((await monthEvents(db, { viewerId: "other", ...nov })).some((e) => e.id === "priv")).toBe(false);
  });

  it("events are placed on their IST day", async () => {
    const dec = await monthEvents(db, { viewerId: null, ...monthRange("2026-12") });
    expect(dec.map((e) => [e.id, e.day])).toEqual([["edge", "2026-12-01"]]);
  });

  it("the grid starts on Monday and fills whole weeks", () => {
    const g = monthGrid(2026, 10); // November 2026 starts on a Sunday
    expect(g.slice(0, 7)).toEqual([null, null, null, null, null, null, "2026-11-01"]);
    expect(g.length % 7).toBe(0);
    expect(g.filter(Boolean)).toHaveLength(30);
  });
});

describe("venues", () => {
  it("lists upcoming published events per venue, private ones only for people involved", async () => {
    const anon = await upcomingByVenue(db, { viewerId: null, now: NOW });
    expect(anon.get("Seminar Hall 2")?.map((e) => e.id)).toEqual(["pub"]);
    expect(anon.get("Sports Complex")?.map((e) => e.id)).toEqual(["edge"]);
    const stu = await upcomingByVenue(db, { viewerId: "stu", now: NOW });
    expect(stu.get("Seminar Hall 2")?.map((e) => e.id)).toEqual(["pub", "priv"]);
  });

  it("directions only for real Google Maps links or coordinates", () => {
    expect(directionsUrl(undefined)).toBeNull();
    expect(directionsUrl({ map: "" })).toBeNull();
    expect(directionsUrl({ map: "19.9975, 73.7898" })).toBe("https://www.google.com/maps/dir/?api=1&destination=19.9975,73.7898");
    expect(directionsUrl({ map: "https://maps.app.goo.gl/abc123" })).toBe("https://maps.app.goo.gl/abc123");
    expect(directionsUrl({ map: "javascript:alert(1)" })).toBeNull();
    expect(directionsUrl({ map: "https://evil.example/maps" })).toBeNull();
  });
});

describe("certificates", () => {
  beforeAll(async () => {
    await db.prepare("INSERT INTO certificates (id, registration_id, event_id, public_code, issued_at) SELECT 'r3', registration_id, event_id, 'TESTCODE', scanned_at FROM checkins WHERE registration_id = 'r3'").run();
  });

  it("exist only for registrations that were checked in", async () => {
    expect((await myCertificates(db, "stu")).map((c) => c.id)).toEqual(["r3"]);
    expect(await myCertificates(db, "other")).toEqual([]);
  });

  it("can be opened by the student, the organizer and admins, nobody else", async () => {
    expect((await certificateFor(db, "r3", { id: "stu", role: "attendee" }))?.name).toBe("Asha Rao");
    expect((await certificateFor(db, "r3", { id: "org", role: "organizer" }))?.organizerName).toBe("Organizer One");
    expect(await certificateFor(db, "r3", { id: "adm", role: "admin" })).not.toBeNull();
    expect(await certificateFor(db, "r3", { id: "other", role: "attendee" })).toBeNull();
    expect(await certificateFor(db, "r4", { id: "other", role: "attendee" })).toBeNull(); // registered, never scanned
  });
});
