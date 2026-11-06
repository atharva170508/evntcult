/** M9: scripts/sample-data/cleanup.sql removes only the seeded sample rows (real local D1). */
import { readFileSync } from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { testDatabase } from "./helpers/d1";

let db: D1Database;
let dispose: () => Promise<void>;
const at = "2026-11-01T00:00:00.000Z";
const REAL_USER = "6f1c2a9e-1111-4c4c-9d9d-aaaaaaaaaaaa";
const REAL_ORG = "6f1c2a9e-2222-4c4c-9d9d-bbbbbbbbbbbb";
const REAL_EVENT = "6f1c2a9e-3333-4c4c-9d9d-cccccccccccc";
const REAL_EVENT_BY_SAMPLE = "6f1c2a9e-4444-4c4c-9d9d-dddddddddddd";

const sqlFile = (name: string) =>
  readFileSync(path.resolve(__dirname, "../scripts/sample-data", name), "utf8")
    .split("\n")
    .filter((l) => !l.trim().startsWith("--"))
    .join("\n")
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);

beforeAll(async () => {
  ({ db, dispose } = await testDatabase());
  const user = (id: string, email: string, role = "attendee") => db.prepare("INSERT INTO users (id, email, name, role, created_at) VALUES (?, ?, ?, ?, ?)").bind(id, email, email, role, at);
  const event = (id: string, org: string) =>
    db
      .prepare(
        `INSERT INTO events (id, slug, title, category, venue, starts_at, ends_at, capacity, price_paise, status, access, organizer_id, created_at)
         VALUES (?, ?, ?, 'TECH', 'Seminar Hall 2', '2026-11-20T12:30:00.000Z', '2026-11-20T14:30:00.000Z', 50, 0, 'published', 'public', ?, ?)`,
      )
      .bind(id, id, id, org, at);
  const reg = (id: string, ev: string, u: string) =>
    db.prepare("INSERT INTO registrations (id, event_id, user_id, status, pass_code, pass_token, created_at) VALUES (?, ?, ?, 'registered', ?, ?, ?)").bind(id, ev, u, `EC-${id}`, `T${id}`, at);
  await db.batch([
    user("usr_000001", "aarav@college.edu", "organizer"),
    user("usr_000002", "sample.student@college.edu"),
    user("usr_000003", "kabir@college.edu", "organizer"), // later organizes a REAL event
    user(REAL_USER, "nakul@college.edu"),
    user(REAL_ORG, "club@college.edu", "organizer"),
    event("evt_00000a", "usr_000001"),
    event(REAL_EVENT, REAL_ORG),
    event(REAL_EVENT_BY_SAMPLE, "usr_000003"),
    reg("reg_00000b", "evt_00000a", "usr_000002"),
    reg("6f1c2a9e-5555-4c4c-9d9d-000000000001", "evt_00000a", REAL_USER), // real person on a sample event
    reg("6f1c2a9e-5555-4c4c-9d9d-000000000002", REAL_EVENT, REAL_USER),
    reg("reg_00000c", REAL_EVENT, "usr_000002"), // sample person on a real event
  ]);
  await db.batch([
    db.prepare("INSERT INTO checkins (id, registration_id, event_id, scanned_at) VALUES ('chk_00000d', 'reg_00000b', 'evt_00000a', ?)").bind(at),
    db.prepare("INSERT INTO checkins (id, registration_id, event_id, scanned_at) VALUES ('6f1c2a9e-6666-4c4c-9d9d-000000000001', '6f1c2a9e-5555-4c4c-9d9d-000000000002', ?, ?)").bind(REAL_EVENT, at),
    db.prepare("INSERT INTO event_updates (id, event_id, kind, body, created_at) VALUES ('upd_00000e', 'evt_00000a', 'update', 'x', ?)").bind(at),
    db.prepare("INSERT INTO event_updates (id, event_id, kind, body, created_at) VALUES ('6f1c2a9e-7777-4c4c-9d9d-000000000001', ?, 'update', 'y', ?)").bind(REAL_EVENT, at),
  ]);
}, 60_000);
afterAll(async () => dispose?.());

const ids = async (table: string) => (await db.prepare(`SELECT id FROM ${table} ORDER BY id`).all<{ id: string }>()).results.map((r) => r.id);

describe("sample data cleanup", () => {
  it("preview counts what would go and changes nothing", async () => {
    const before = await ids("users");
    const rows = (await db.batch(sqlFile("preview.sql").map((s) => db.prepare(s)))).flatMap((r) => r.results as { what: string; n: number }[]);
    const n = Object.fromEntries(rows.map((r) => [r.what, r.n]));
    expect(n["sample events"]).toBe(1);
    expect(n["sample users"]).toBe(3);
    expect(n["sample users kept (they organize a real event)"]).toBe(1);
    expect(n["registrations removed"]).toBe(3);
    expect(n["real events (kept)"]).toBe(2);
    expect(await ids("users")).toEqual(before);
  });

  it("removes only sample rows and keeps everything real", async () => {
    await db.batch(sqlFile("cleanup.sql").map((s) => db.prepare(s)));
    expect(await ids("events")).toEqual([REAL_EVENT, REAL_EVENT_BY_SAMPLE].sort());
    expect(await ids("users")).toEqual([REAL_USER, REAL_ORG, "usr_000003"].sort());
    expect(await ids("registrations")).toEqual(["6f1c2a9e-5555-4c4c-9d9d-000000000002"]);
    expect(await ids("checkins")).toEqual(["6f1c2a9e-6666-4c4c-9d9d-000000000001"]);
    expect(await ids("event_updates")).toEqual(["6f1c2a9e-7777-4c4c-9d9d-000000000001"]);
  });
});
