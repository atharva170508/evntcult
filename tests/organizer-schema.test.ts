/**
 * Migrations 0009/0010 (organizer dashboard), run against a real local D1 database holding
 * data shaped like the live site, then attacked on purpose.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { applyMigrations, testDatabase } from "./helpers/d1";
import { promoteWaitlist, register, type EventForRegistration } from "@/lib/data/registrations";

let db: D1Database;
let dispose: () => Promise<void>;
const NOW = "2026-11-01T00:00:00.000Z";
const START = "2026-12-01T12:00:00.000Z";
const END = "2026-12-01T15:00:00.000Z";

const insertOld = (id: string, capacity: number, extra = "") =>
  db
    .prepare(
      `INSERT INTO events (id, slug, title, category, venue, starts_at, ends_at, capacity, status, organizer_id, created_at, tagline, organizer_upi_id, event_type ${extra ? ", meeting_url" : ""})
       VALUES (?1, ?1, 'Old event', 'TALK', 'Seminar Hall 2', ?2, ?3, ?4, 'published', 'org', ?5, 'hello', 'club@okaxis', ${extra ? "'virtual', ?6" : "'in_person'"})`,
    )
    .bind(...(extra ? [id, START, END, capacity, NOW, extra] : [id, START, END, capacity, NOW]))
    .run();

const row = (id: string) => db.prepare("SELECT * FROM events WHERE id = ?").bind(id).first<Record<string, unknown>>();

/** A draft insert that names only the columns under test. */
const insertDraft = (over: Partial<Record<"capacity" | "ends_at" | "access" | "access_code" | "category" | "status" | "price_paise", unknown>>) => {
  const v = { capacity: null, ends_at: END, access: "public", access_code: null, category: null, status: "draft", price_paise: 0, ...over };
  const id = `bad-${Math.random().toString(36).slice(2)}`;
  return db
    .prepare(
      `INSERT INTO events (id, slug, title, category, starts_at, ends_at, capacity, price_paise, status, access, access_code, organizer_id, created_at)
       VALUES (?, ?, 'T', ?, ?, ?, ?, ?, ?, ?, ?, 'org', ?)`,
    )
    .bind(id, id, v.category, START, v.ends_at, v.capacity, v.price_paise, v.status, v.access, v.access_code, NOW)
    .run();
};

beforeAll(async () => {
  const t = await testDatabase({ until: "0008" });
  db = t.db;
  dispose = t.dispose;

  await db.prepare("INSERT INTO users (id, email, name, role, created_at) VALUES ('org', 'o@x.edu', 'Org', 'organizer', ?)").bind(NOW).run();
  for (const n of [1, 2, 3]) await db.prepare("INSERT INTO users (id, email, name, role, created_at) VALUES (?, ?, 'U', 'attendee', ?)").bind(`u${n}`, `u${n}@x.edu`, NOW).run();

  await insertOld("kept", 200);
  await insertOld("sentinel", 100_000);
  await insertOld("online", 50, "https://meet.google.com/abc");
  await db
    .prepare("INSERT INTO registrations (id, event_id, user_id, status, pass_code, pass_token, payment_status, created_at) VALUES ('r1', 'kept', 'u1', 'registered', 'EC-KEPT-0001', 'TOKEN1', 'unpaid', ?)")
    .bind(NOW)
    .run();
  await db.prepare("INSERT INTO event_updates (id, event_id, kind, body, created_at) VALUES ('up1', 'kept', 'update', 'Hi', ?)").bind(NOW).run();

  await applyMigrations(db, { from: "0009" });
}, 60_000);

afterAll(() => dispose());

describe("data survives the rebuild", () => {
  it("copies every row and column", async () => {
    expect((await db.prepare("SELECT COUNT(*) n FROM events").first<{ n: number }>())!.n).toBe(3);
    expect(await row("kept")).toMatchObject({ title: "Old event", category: "TALK", venue: "Seminar Hall 2", capacity: 200, tagline: "hello", organizer_upi_id: "club@okaxis", version: 1, updated_at: NOW });
  });

  it("turns the old 100000 placeholder into a real unlimited", async () => {
    expect((await row("sentinel"))!.capacity).toBeNull();
  });

  it("keeps a real capacity, and marks old online events", async () => {
    expect((await row("online"))!.capacity).toBe(50);
    expect(await row("online")).toMatchObject({ venue_status: "online", meeting_url: "https://meet.google.com/abc", published_at: NOW });
  });

  it("registrations and updates still point at their event", async () => {
    const r = await db.prepare("SELECT e.title FROM registrations r JOIN events e ON e.id = r.event_id WHERE r.id = 'r1'").first<{ title: string }>();
    expect(r?.title).toBe("Old event");
    expect((await db.prepare("PRAGMA foreign_key_check").all()).results).toEqual([]);
    await expect(db.prepare("INSERT INTO registrations (id, event_id, user_id, status, pass_code, pass_token, payment_status, created_at) VALUES ('rX', 'ghost', 'u1', 'registered', 'X', 'TOKENX', 'unpaid', ?)").bind(NOW).run()).rejects.toThrow(/FOREIGN KEY/i);
  });

  it("rebuilt every index", async () => {
    const names = (await db.prepare("SELECT name FROM sqlite_master WHERE type = 'index' AND tbl_name = 'events' AND name LIKE 'idx_%'").all<{ name: string }>()).results.map((r) => r.name);
    expect(names.sort()).toEqual(["idx_events_code", "idx_events_org", "idx_events_starts"]);
  });
});

describe("unlimited really is unlimited", () => {
  const unlimited: EventForRegistration = { id: "sentinel", slug: "sentinel", capacity: null, status: "published", starts_at: START, ends_at: END };

  it("seats are never full when capacity is empty", async () => {
    const at = new Date(NOW);
    for (const u of ["u1", "u2", "u3"]) expect((await register(db, unlimited, u, { waitlist: false, now: at })).kind).toBe("registered");
  });

  it("the waitlist empties if an event is switched to unlimited", async () => {
    await db.prepare("INSERT INTO registrations (id, event_id, user_id, status, pass_code, pass_token, payment_status, created_at) VALUES ('w1', 'sentinel', 'org', 'waitlisted', 'EC-SENT-0099', 'TOKENW', 'unpaid', ?)").bind(NOW).run();
    const promoted = await promoteWaitlist(db, "sentinel", new Date(NOW));
    expect(promoted.map((r) => r.id)).toEqual(["w1"]);
  });
});

describe("broken on purpose: the database refuses bad data", () => {
  it("accepts an incomplete draft", async () => {
    await expect(insertDraft({})).resolves.toBeTruthy();
  });
  it.each([
    ["zero capacity", { capacity: 0 }],
    ["negative capacity", { capacity: -5 }],
    ["ends before it starts", { ends_at: "2026-12-01T11:00:00.000Z" }],
    ["ends exactly when it starts", { ends_at: START }],
    ["code access with no code", { access: "code" }],
    ["unknown category", { category: "CHESS" }],
    ["unknown status", { status: "live" }],
    ["negative price", { price_paise: -1 }],
  ])("rejects %s", async (_name, over) => {
    await expect(insertDraft(over)).rejects.toThrow(/CHECK/i);
  });
  it("two events cannot share an access code", async () => {
    await insertDraft({ access: "code", access_code: "GARBA26" });
    await expect(insertDraft({ access: "code", access_code: "GARBA26" })).rejects.toThrow(/UNIQUE/i);
  });
});
