/** Gate check-in rules, against a real local D1 (in memory). */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { testDatabase } from "./helpers/d1";
import { buildManifest, checkIn, gateCounts, tokenHash } from "@/lib/data/checkins";
import { passQrPayload } from "@/lib/tokens";

let db: D1Database;
let dispose: () => Promise<void>;
const T0 = new Date("2026-11-20T12:00:00.000Z");
let n = 0;
const scanId = () => `scan-${++n}`;

/** token = 26 base32 chars; we make readable fake ones. */
const tok = (s: string) => s.toUpperCase().padEnd(26, "A").slice(0, 26);

async function setup() {
  const at = T0.toISOString();
  await db.batch([
    db.prepare("INSERT INTO users (id, email, name, role, created_at) VALUES ('org','org@c.edu','Org','organizer',?)").bind(at),
    db.prepare("INSERT INTO users (id, email, name, role, created_at) VALUES ('a','a@c.edu','Asha Rao','attendee',?)").bind(at),
    db.prepare("INSERT INTO users (id, email, name, role, created_at) VALUES ('b','b@c.edu','Bilal Khan','attendee',?)").bind(at),
    db.prepare("INSERT INTO users (id, email, name, role, created_at) VALUES ('c','c@c.edu','Chitra Nair','attendee',?)").bind(at),
    db.prepare("INSERT INTO users (id, email, name, role, created_at) VALUES ('d','d@c.edu','Dev Shah','attendee',?)").bind(at),
    db.prepare(`INSERT INTO events (id, slug, title, category, venue, starts_at, ends_at, capacity, price_paise, status, organizer_id, created_at)
                VALUES ('free','free-night','Free Night','PARTY','Hall','2026-11-20T13:00:00.000Z','2026-11-20T17:00:00.000Z',10,0,'published','org',?)`).bind(at),
    db.prepare(`INSERT INTO events (id, slug, title, category, venue, starts_at, ends_at, capacity, price_paise, status, organizer_id, created_at)
                VALUES ('paid','paid-night','Paid Night','PARTY','Hall','2026-11-20T13:00:00.000Z','2026-11-20T17:00:00.000Z',10,29900,'published','org',?)`).bind(at),
    db.prepare("INSERT INTO registrations (id,event_id,user_id,status,pass_code,pass_token,payment_status,created_at) VALUES ('r1','free','a','registered','EC-FREE-0001',?, 'unpaid', ?)").bind(tok("asha"), at),
    db.prepare("INSERT INTO registrations (id,event_id,user_id,status,pass_code,pass_token,payment_status,created_at) VALUES ('r2','free','b','waitlisted','EC-FREE-0002',?, 'unpaid', ?)").bind(tok("bilal"), at),
    db.prepare("INSERT INTO registrations (id,event_id,user_id,status,pass_code,pass_token,payment_status,created_at) VALUES ('r3','free','c','cancelled','EC-FREE-0003',?, 'unpaid', ?)").bind(tok("chitra"), at),
    db.prepare("INSERT INTO registrations (id,event_id,user_id,status,pass_code,pass_token,payment_status,created_at) VALUES ('r4','paid','d','registered','EC-PAID-0001',?, 'unpaid', ?)").bind(tok("dev"), at),
    db.prepare("INSERT INTO registrations (id,event_id,user_id,status,pass_code,pass_token,payment_status,created_at) VALUES ('r5','paid','a','registered','EC-PAID-0002',?, 'paid', ?)").bind(tok("ashapaid"), at),
  ]);
}

beforeAll(async () => {
  ({ db, dispose } = await testDatabase());
  await setup();
}, 60_000);
afterAll(async () => dispose?.());

describe("gate check-in", { timeout: 30_000 }, () => {
  it("green: a valid pass is admitted (QR text or raw token both work)", async () => {
    const r = await checkIn(db, { eventId: "free", passToken: passQrPayload(tok("asha")), clientScanId: scanId(), now: T0 });
    expect(r).toMatchObject({ result: "admitted", color: "green", name: "Asha Rao", passCode: "EC-FREE-0001", replay: false });
    expect(await gateCounts(db, "free")).toEqual({ checkedIn: 1, registered: 1 });
  });

  it("amber: scanning the same pass again says 'already in' with the original time", async () => {
    const r = await checkIn(db, { eventId: "free", passToken: tok("asha"), clientScanId: scanId(), now: new Date(T0.getTime() + 60_000) });
    expect(r).toMatchObject({ result: "already_in", color: "amber", scannedAt: T0.toISOString() });
    expect((await gateCounts(db, "free")).checkedIn).toBe(1);
  });

  it("the same client_scan_id sent twice (offline sync retry) returns the first result, not 'already in'", async () => {
    const id = scanId();
    const first = await checkIn(db, { eventId: "paid", passToken: tok("ashapaid"), clientScanId: id, now: T0 });
    const second = await checkIn(db, { eventId: "paid", passToken: tok("ashapaid"), clientScanId: id, now: T0 });
    expect(first).toMatchObject({ result: "admitted", replay: false });
    expect(second).toMatchObject({ result: "admitted", replay: true });
    expect((await gateCounts(db, "paid")).checkedIn).toBe(1);
  });

  it("red: fake, waitlisted, cancelled and other-event passes", async () => {
    expect(await checkIn(db, { eventId: "free", passToken: "hello world", clientScanId: scanId(), now: T0 })).toMatchObject({ color: "red", reason: "unknown" });
    expect(await checkIn(db, { eventId: "free", passToken: tok("nobody"), clientScanId: scanId(), now: T0 })).toMatchObject({ color: "red", reason: "unknown" });
    expect(await checkIn(db, { eventId: "free", passToken: tok("bilal"), clientScanId: scanId(), now: T0 })).toMatchObject({ color: "red", reason: "waitlisted" });
    expect(await checkIn(db, { eventId: "free", passToken: tok("chitra"), clientScanId: scanId(), now: T0 })).toMatchObject({ color: "red", reason: "cancelled" });
    expect(await checkIn(db, { eventId: "free", passToken: tok("dev"), clientScanId: scanId(), now: T0 })).toMatchObject({ color: "red", reason: "other_event" });
  });

  it("amber unpaid: asks to collect the fee, admits only after the volunteer accepts", async () => {
    const ask = await checkIn(db, { eventId: "paid", passToken: tok("dev"), clientScanId: scanId(), now: T0 });
    expect(ask).toMatchObject({ result: "unpaid", color: "amber", amountPaise: 29900 });
    expect((await gateCounts(db, "paid")).checkedIn).toBe(1); // still only Asha

    const ok = await checkIn(db, { eventId: "paid", passToken: tok("dev"), clientScanId: scanId(), acceptUnpaid: true, now: T0 });
    expect(ok).toMatchObject({ result: "admitted" });
    const audit = await db.prepare("SELECT meta FROM audit_log WHERE action = 'checkin' AND target_id = 'r4'").first<{ meta: string }>();
    expect(JSON.parse(audit!.meta)).toMatchObject({ unpaid_admitted: true });
  });

  it("two gates scanning the same pass at the same moment: exactly one is admitted", async () => {
    await db.prepare("DELETE FROM checkins WHERE registration_id = 'r1'").run();
    const results = await Promise.all(Array.from({ length: 8 }, () => checkIn(db, { eventId: "free", passToken: tok("asha"), clientScanId: scanId(), now: T0 })));
    expect(results.filter((r) => r.result === "admitted")).toHaveLength(1);
    expect(results.filter((r) => r.result === "already_in")).toHaveLength(7);
  });

  it("offline scan times are kept, but not if they're in the future", async () => {
    await db.prepare("DELETE FROM checkins WHERE registration_id = 'r1'").run();
    const earlier = new Date(T0.getTime() - 10 * 60_000);
    const r = await checkIn(db, { eventId: "free", passToken: tok("asha"), clientScanId: scanId(), scannedAt: earlier, now: T0 });
    expect(r).toMatchObject({ scannedAt: earlier.toISOString() });
    await db.prepare("DELETE FROM checkins WHERE registration_id = 'r1'").run();
    const future = await checkIn(db, { eventId: "free", passToken: tok("asha"), clientScanId: scanId(), scannedAt: new Date(T0.getTime() + 3_600_000), now: T0 });
    expect(future).toMatchObject({ scannedAt: T0.toISOString() });
  });
});

describe("offline guest list", { timeout: 30_000 }, () => {
  it("lists seated people by token hash, with no raw tokens, emails or phones", async () => {
    const m = (await buildManifest(db, "paid", T0))!;
    expect(m.entries).toHaveLength(2);
    const dev = m.entries.find((e) => e.code === "EC-PAID-0001")!;
    // Dev paid cash at the gate earlier, but "mark paid" is M4, so the DB still says unpaid.
    expect(dev).toMatchObject({ h: await tokenHash(tok("dev")), name: "Dev Shah", unpaid: true });
    expect(dev.in).not.toBeNull(); // already checked in
    const json = JSON.stringify(m);
    expect(json).not.toContain(tok("dev"));
    expect(json).not.toContain("@c.edu");
    expect(m.entries.find((e) => e.code === "EC-PAID-0002")).toMatchObject({ unpaid: false });
  });

  it("token hashes match whether you hash the QR text or the token", async () => {
    expect(await tokenHash(passQrPayload(tok("dev")))).toBe(await tokenHash(tok("dev")));
    expect(await tokenHash(tok("dev"))).toMatch(/^[0-9a-f]{64}$/);
  });
});
