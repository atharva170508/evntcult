/** Owner panel: the secret-code step, the panel cookie, and the overview numbers. */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { testDatabase } from "./helpers/d1";
import { ADMIN_EMAIL, MAX_MISSES, adminExport, adminOverview, checkAdminGate, ownerAction } from "@/lib/data/admin";
import { createAdminValue, createSessionValue, readAdminValue } from "@/lib/session";

let db: D1Database;
let dispose: () => Promise<void>;
const now = new Date("2026-11-20T06:30:00.000Z");
const expected = "test-secret";
process.env.SESSION_SECRET = "x".repeat(40);

beforeAll(async () => {
  ({ db, dispose } = await testDatabase());
}, 60_000);
afterAll(() => dispose());

describe("owner gate", () => {
  it("right email and code pass, whatever the email's case", async () => {
    await expect(checkAdminGate(db, { email: " EVNTCULT@gmail.com ", code: expected, expected, ip: "1.1.1.1", now })).resolves.toBeUndefined();
  });

  it("a wrong code or wrong email fails the same way", async () => {
    const wrong = { status: 401, code: "wrong_details" };
    await expect(checkAdminGate(db, { email: ADMIN_EMAIL, code: "nope", expected, ip: "2.2.2.2", now })).rejects.toMatchObject(wrong);
    await expect(checkAdminGate(db, { email: "x@gmail.com", code: expected, expected, ip: "2.2.2.2", now })).rejects.toMatchObject(wrong);
  });

  it("broken on purpose: guessing locks that IP, even with the right code, and only that IP", async () => {
    for (let i = 0; i < MAX_MISSES; i++) await checkAdminGate(db, { email: ADMIN_EMAIL, code: `g${i}`, expected, ip: "3.3.3.3", now }).catch(() => {});
    await expect(checkAdminGate(db, { email: ADMIN_EMAIL, code: expected, expected, ip: "3.3.3.3", now })).rejects.toMatchObject({ status: 429 });
    await expect(checkAdminGate(db, { email: ADMIN_EMAIL, code: expected, expected, ip: "4.4.4.4", now })).resolves.toBeUndefined();
    const later = new Date(now.getTime() + 16 * 60_000);
    await expect(checkAdminGate(db, { email: ADMIN_EMAIL, code: expected, expected, ip: "3.3.3.3", now: later })).resolves.toBeUndefined();
  });

  it("stays shut if the secret isn't set", async () => {
    await expect(checkAdminGate(db, { email: ADMIN_EMAIL, code: "", expected: undefined, ip: "5.5.5.5", now })).rejects.toMatchObject({ status: 503 });
    await expect(checkAdminGate(db, { email: ADMIN_EMAIL, code: "undefined", expected: "", ip: "5.5.5.5", now })).rejects.toMatchObject({ status: 503 });
  });
});

describe("panel cookie", () => {
  it("opens the panel until it expires", async () => {
    const v = await createAdminValue(now.getTime());
    expect(await readAdminValue(v, now.getTime())).toBe(true);
    expect(await readAdminValue(v, now.getTime() + 9 * 3_600_000)).toBe(false);
  });

  it("broken on purpose: a student's cookie, an edited cookie and nothing at all are refused", async () => {
    expect(await readAdminValue(await createSessionValue("admin", now.getTime()), now.getTime())).toBe(false);
    const v = await createAdminValue(now.getTime());
    const [a, exp, sig] = v.split(".");
    expect(await readAdminValue(`${a}.${Number(exp) + 99999}.${sig}`, now.getTime())).toBe(false);
    expect(await readAdminValue(undefined)).toBe(false);
  });
});

describe("overview", () => {
  it("works on an empty site, and a search with % stays literal", async () => {
    const o = await adminOverview(db, "%", now);
    expect(o.stats.users).toBe(0);
    expect(o.users).toEqual([]);
  });
});

describe("owner controls", () => {
  beforeAll(async () => {
    await db.prepare("INSERT INTO users (id, email, name, role, created_at) VALUES ('u1', 'u1@college.edu', '=BAD()', 'organizer', ?)").bind(now.toISOString()).run();
    await db
      .prepare("INSERT INTO events (id, slug, title, category, venue, starts_at, ends_at, capacity, price_paise, status, organizer_id, created_at) VALUES ('e1', 'e1', 'E', 'PARTY', 'Hall', ?, ?, 5, 100, 'published', 'u1', ?)")
      .bind("2026-12-01T10:00:00.000Z", "2026-12-01T12:00:00.000Z", now.toISOString())
      .run();
  });
  const status = async () => (await db.prepare("SELECT status FROM events WHERE id = 'e1'").first<{ status: string }>())!.status;

  it("take down and restore, and doing it twice is refused", async () => {
    await ownerAction(db, "take_down", "e1", now);
    expect(await status()).toBe("cancelled");
    await expect(ownerAction(db, "take_down", "e1", now)).rejects.toMatchObject({ status: 409 });
    await ownerAction(db, "restore", "e1", now);
    expect(await status()).toBe("published");
  });

  it("block is reversible and audited", async () => {
    await ownerAction(db, "block", "u1", now);
    expect((await adminOverview(db, null, now)).users[0].blocked_at).toBeTruthy();
    await ownerAction(db, "unblock", "u1", now);
    expect((await adminOverview(db, null, now)).users[0].blocked_at).toBeNull();
    const log = await db.prepare("SELECT COUNT(*) AS n FROM audit_log WHERE action LIKE 'owner_%'").first<{ n: number }>();
    expect(log!.n).toBe(4);
  });

  it("broken on purpose: a spreadsheet formula in a name is defused in the CSV", async () => {
    expect(await adminExport(db, "users")).toContain("'=BAD()");
    expect(await adminExport(db, "events")).toContain("u1@college.edu");
  });

  it("the 14-day chart always has 14 days", async () => {
    const o = await adminOverview(db, null, now);
    expect(o.signups).toHaveLength(14);
    expect(o.signups[13].n).toBe(1);
  });
});
