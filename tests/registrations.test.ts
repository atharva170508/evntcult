/**
 * Registration, waitlist and hold rules, tested against a real local D1 database
 * (wrangler's getPlatformProxy, in memory, so your dev database is never touched).
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { testDatabase } from "./helpers/d1";
import { createTeam, joinTeam, myTeam, teamByCode, teamNameTaken } from "@/lib/data/teams";
import {
  cancel,
  confirmHold,
  decideRequest,
  addWalkIn,
  holdExpiry,
  promoteWaitlist,
  register,
  RegistrationError,
  sweepHolds,
  type EventForRegistration,
} from "@/lib/data/registrations";

let db: D1Database;
let dispose: () => Promise<void>;

const HOUR = 3_600_000;
const T0 = new Date("2026-11-20T04:30:00.000Z"); // 10:00 IST
const at = (minutes: number) => new Date(T0.getTime() + minutes * 60_000);

async function addUser(n: number) {
  const id = `u${n}`;
  await db.prepare("INSERT INTO users (id, email, name, role, created_at) VALUES (?, ?, ?, 'attendee', ?)").bind(id, `u${n}@college.edu`, `User ${n}`, T0.toISOString()).run();
  return id;
}

let eventSeq = 0;
async function addEvent(capacity: number, startsInHours = 48): Promise<EventForRegistration> {
  const e = {
    id: `evt${++eventSeq}`,
    slug: `test-event-${eventSeq}`,
    capacity,
    status: "published",
    starts_at: new Date(T0.getTime() + startsInHours * HOUR).toISOString(),
    ends_at: new Date(T0.getTime() + (startsInHours + 3) * HOUR).toISOString(),
  };
  await db
    .prepare(
      `INSERT INTO events (id, slug, title, category, venue, starts_at, ends_at, capacity, status, organizer_id, created_at)
       VALUES (?, ?, 'Test', 'TECH', 'Hall', ?, ?, ?, 'published', 'org', ?)`,
    )
    .bind(e.id, e.slug, e.starts_at, e.ends_at, capacity, T0.toISOString())
    .run();
  return e;
}

const counts = async (eventId: string) =>
  (await db
    .prepare(
      `SELECT SUM(status = 'registered') AS registered, SUM(status = 'waitlisted') AS waitlisted,
              SUM(status = 'waitlisted' AND hold_expires_at IS NOT NULL) AS held
         FROM registrations WHERE event_id = ?`,
    )
    .bind(eventId)
    .first<{ registered: number; waitlisted: number; held: number }>())!;

const regOf = async (eventId: string, userId: string) =>
  (await db.prepare("SELECT * FROM registrations WHERE event_id = ? AND user_id = ?").bind(eventId, userId).first<{ id: string; status: string; hold_expires_at: string | null; pass_code: string; pass_token: string }>())!;

beforeAll(async () => {
  ({ db, dispose } = await testDatabase());
  await db.prepare("INSERT INTO users (id, email, name, role, created_at) VALUES ('org', 'org@college.edu', 'Org', 'organizer', ?)").bind(T0.toISOString()).run();
  for (let i = 1; i <= 60; i++) await addUser(i);
}, 60_000);

afterAll(async () => {
  await dispose?.();
});

describe("holdExpiry", () => {
  it("is 2 hours when the event is far away", () => {
    expect(holdExpiry(T0, at(48 * 60).toISOString(), at(51 * 60).toISOString())).toBe(at(120).toISOString());
  });
  it("stops at the event start", () => {
    expect(holdExpiry(T0, at(60).toISOString(), at(240).toISOString())).toBe(at(60).toISOString());
  });
  it("gives at least 20 minutes, but never past the end", () => {
    expect(holdExpiry(T0, at(5).toISOString(), at(180).toISOString())).toBe(at(20).toISOString());
    expect(holdExpiry(T0, at(-60).toISOString(), at(10).toISOString())).toBe(at(10).toISOString());
  });
});

describe("racing registrations", () => {
  it("50 people racing for 10 seats: exactly 10 get in, nobody goes over capacity", async () => {
    const e = await addEvent(10);
    const results = await Promise.all(Array.from({ length: 50 }, (_, i) => register(db, e, `u${i + 1}`, { now: T0 })));
    expect(results.filter((r) => r.kind === "registered")).toHaveLength(10);
    expect(results.filter((r) => r.kind === "full")).toHaveLength(40);
    expect((await counts(e.id)).registered).toBe(10);

    // Now the other 40 all join the waitlist at once: still exactly 10 seats used.
    const losers = results.map((r, i) => (r.kind === "full" ? `u${i + 1}` : null)).filter(Boolean) as string[];
    await Promise.all(losers.map((u) => register(db, e, u, { waitlist: true, now: T0 })));
    const c = await counts(e.id);
    expect(c.registered).toBe(10);
    expect(c.waitlisted).toBe(40);
    expect(c.held).toBe(0);

    const codes = await db.prepare("SELECT COUNT(DISTINCT pass_code) AS a, COUNT(DISTINCT pass_token) AS b, COUNT(*) AS n FROM registrations WHERE event_id = ?").bind(e.id).first<{ a: number; b: number; n: number }>();
    expect(codes).toEqual({ a: 50, b: 50, n: 50 });
  }, 60_000);

  it("registering twice (double-click) returns the same registration", async () => {
    const e = await addEvent(5);
    const [a, b] = await Promise.all([register(db, e, "u1", { now: T0 }), register(db, e, "u1", { now: T0 })]);
    expect(a.kind).toBe("registered");
    expect(b.kind).toBe("registered");
    expect((await counts(e.id)).registered).toBe(1);
  });

  it("refuses closed and ended events", async () => {
    const e = await addEvent(5);
    await expect(register(db, { ...e, status: "draft" }, "u1", { now: T0 })).rejects.toMatchObject({ code: "not_open" });
    await expect(register(db, e, "u1", { now: at(60 * 60) })).rejects.toBeInstanceOf(RegistrationError);
  });
});

describe("waitlist order and holds", { timeout: 30_000 }, () => {
  let e: EventForRegistration;

  beforeEach(async () => {
    e = await addEvent(2);
    await register(db, e, "u1", { now: at(0) });
    await register(db, e, "u2", { now: at(1) });
    // Three people join the waitlist one minute apart.
    for (const [i, u] of ["u3", "u4", "u5"].entries()) {
      const r = await register(db, e, u, { waitlist: true, now: at(2 + i) });
      expect(r).toMatchObject({ kind: "waitlisted", position: i + 1 });
    }
  });

  it("a cancellation gives the hold to the person who waited longest", async () => {
    await cancel(db, (await regOf(e.id, "u2")).id, "u2", at(10));
    expect((await regOf(e.id, "u3")).hold_expires_at).toBe(at(130).toISOString());
    expect((await regOf(e.id, "u4")).hold_expires_at).toBeNull();
    expect((await regOf(e.id, "u5")).hold_expires_at).toBeNull();

    // A newcomer can't jump the queue while people are waiting.
    const newcomer = await register(db, e, "u6", { now: at(11) });
    expect(newcomer).toMatchObject({ kind: "full", position: 4 });
  });

  it("the holder confirms and becomes registered; the next person keeps waiting", async () => {
    await cancel(db, (await regOf(e.id, "u2")).id, "u2", at(10));
    const confirmed = await confirmHold(db, (await regOf(e.id, "u3")).id, "u3", at(30));
    expect(confirmed.status).toBe("registered");
    const c = await counts(e.id);
    expect(c.registered).toBe(2);
    expect(c.held).toBe(0);

    // The next cancellation goes to u4, not u5.
    await cancel(db, (await regOf(e.id, "u1")).id, "u1", at(40));
    expect((await regOf(e.id, "u4")).hold_expires_at).not.toBeNull();
    expect((await regOf(e.id, "u5")).hold_expires_at).toBeNull();
  });

  it("only the waitlist head can confirm, and only while holding", async () => {
    await expect(confirmHold(db, (await regOf(e.id, "u4")).id, "u4", at(30))).rejects.toMatchObject({ code: "no_hold" });
    await expect(confirmHold(db, (await regOf(e.id, "u3")).id, "u4", at(30))).rejects.toMatchObject({ code: "not_found" });
  });

  it("an expired hold is cancelled and the seat moves to the next person", async () => {
    await cancel(db, (await regOf(e.id, "u2")).id, "u2", at(10));
    const hold = (await regOf(e.id, "u3")).hold_expires_at!;

    // Before it runs out, the sweep leaves this hold alone.
    await sweepHolds(db, at(60));
    expect((await regOf(e.id, "u3")).hold_expires_at).toBe(hold);

    // After it runs out: u3 loses the spot, u4 gets a fresh hold.
    // (The sweep covers every event, so other tests' expired holds count too.)
    const swept = await sweepHolds(db, new Date(Date.parse(hold) + 1000));
    expect(swept.expired).toBeGreaterThanOrEqual(1);
    expect(swept.promoted).toBeGreaterThanOrEqual(1);
    expect((await regOf(e.id, "u3")).status).toBe("cancelled");
    expect((await regOf(e.id, "u4")).hold_expires_at).not.toBeNull();
    await expect(confirmHold(db, (await regOf(e.id, "u3")).id, "u3", at(200))).rejects.toMatchObject({ code: "hold_expired" });

    const c = await counts(e.id);
    expect(c.registered + c.held).toBeLessThanOrEqual(e.capacity!);
  });

  it("raising capacity fills the new seats from the queue in order", async () => {
    await db.prepare("UPDATE events SET capacity = 4 WHERE id = ?").bind(e.id).run();
    const promoted = await promoteWaitlist(db, e.id, at(20));
    expect(promoted.map((r) => r.user_id)).toEqual(["u3", "u4"]);
    expect((await regOf(e.id, "u5")).hold_expires_at).toBeNull();
  });

  it("concurrent sweeps never hand out more holds than free seats", async () => {
    await cancel(db, (await regOf(e.id, "u1")).id, "u1", at(10));
    await Promise.all(Array.from({ length: 10 }, () => promoteWaitlist(db, e.id, at(11))));
    expect((await counts(e.id)).held).toBe(1);
  });
});

describe("cancel and re-register", { timeout: 30_000 }, () => {
  it("cancelling then registering again works and issues a new pass token", async () => {
    const e = await addEvent(3);
    const first = await register(db, e, "u1", { now: at(0) });
    if (first.kind !== "registered") throw new Error("expected registered");
    await cancel(db, first.registration.id, "u1", at(5));
    await expect(cancel(db, first.registration.id, "u1", at(6))).rejects.toMatchObject({ code: "already_cancelled" });

    const again = await register(db, e, "u1", { now: at(10) });
    expect(again.kind).toBe("registered");
    if (again.kind !== "registered") return;
    expect(again.registration.id).toBe(first.registration.id);
    expect(again.registration.pass_code).toBe(first.registration.pass_code);
    expect(again.registration.pass_token).not.toBe(first.registration.pass_token);
  });

  it("you can't cancel someone else's registration, or after checking in", async () => {
    const e = await addEvent(3);
    const r = await register(db, e, "u1", { now: at(0) });
    if (r.kind !== "registered") throw new Error("expected registered");
    await expect(cancel(db, r.registration.id, "u2", at(1))).rejects.toMatchObject({ code: "not_found" });
    await db.prepare("INSERT INTO checkins (id, registration_id, event_id, scanned_at) VALUES ('c1', ?, ?, ?)").bind(r.registration.id, e.id, at(2).toISOString()).run();
    await expect(cancel(db, r.registration.id, "u1", at(3))).rejects.toMatchObject({ code: "checked_in" });
  });

  it("two events with the same 4-letter prefix get different pass codes", async () => {
    const a = await addEvent(3);
    const b = { ...(await addEvent(3)) };
    await db.prepare("UPDATE events SET slug = 'robowars-x' WHERE id = ?").bind(a.id).run();
    await db.prepare("UPDATE events SET slug = 'robotics-y' WHERE id = ?").bind(b.id).run();
    const ra = await register(db, { ...a, slug: "robowars-x" }, "u1", { now: at(0) });
    const rb = await register(db, { ...b, slug: "robotics-y" }, "u1", { now: at(0) });
    if (ra.kind !== "registered" || rb.kind !== "registered") throw new Error("expected registered");
    expect(ra.registration.pass_code).toBe("EC-ROBO-0001");
    expect(rb.registration.pass_code).toBe("EC-ROBO-0002");
  });
});

describe("sign-up rules", () => {
  it("refuses new sign-ups after the cutoff, but keeps existing ones", async () => {
    const e = { ...(await addEvent(10)), reg_closes_at: at(30).toISOString() };
    const before = await register(db, e, "u1", { now: at(10) });
    expect(before.kind).toBe("registered");
    await expect(register(db, e, "u2", { now: at(31) })).rejects.toMatchObject({ code: "closed" });
    // Asking again for an existing registration still returns it.
    expect((await register(db, e, "u1", { now: at(40) })).kind).toBe("registered");
  });

  it("with host approval, sign-ups wait, nobody moves up alone, and approval respects capacity", async () => {
    const base = await addEvent(1);
    await db.prepare("UPDATE events SET requires_approval = 1 WHERE id = ?").bind(base.id).run();
    const e = { ...base, requires_approval: 1 };
    const a = await register(db, e, "u1", { now: at(0) });
    const b = await register(db, e, "u2", { now: at(1) });
    expect(a.kind).toBe("waitlisted");
    expect(b.kind).toBe("waitlisted");
    expect(await promoteWaitlist(db, e.id, at(2))).toHaveLength(0);
    expect((await counts(e.id)).held).toBe(0);

    const ra = await regOf(e.id, "u1");
    const rb = await regOf(e.id, "u2");
    expect(await decideRequest(db, e.id, ra.id, "approve", "org", at(3))).toBe("approved");
    expect(await decideRequest(db, e.id, rb.id, "approve", "org", at(4))).toBe("full");
    expect(await decideRequest(db, e.id, rb.id, "decline", "org", at(5))).toBe("declined");
    expect(await decideRequest(db, e.id, rb.id, "decline", "org", at(6))).toBe("not_found");
    expect((await regOf(e.id, "u1")).status).toBe("registered");
    expect((await regOf(e.id, "u2")).status).toBe("cancelled");
  });
});

describe("walk-ins", () => {
  it("registers and checks in a new guest, even past capacity, and is safe to repeat", async () => {
    const e = await addEvent(1);
    await register(db, e, "u1", { now: at(0) });
    const w = await addWalkIn(db, e, { name: "Door Guest" }, "org", at(1));
    expect(w.alreadyIn).toBe(false);
    expect(w.registration.status).toBe("registered");
    expect((await counts(e.id)).registered).toBe(2);
    const checked = await db.prepare("SELECT COUNT(*) AS n FROM checkins WHERE event_id = ?").bind(e.id).first<{ n: number }>();
    expect(checked!.n).toBe(1);
    // An existing account by email is reused; adding them twice just says they're in.
    const a = await addWalkIn(db, e, { name: "U2", email: "u2@college.edu" }, "org", at(2));
    const b = await addWalkIn(db, e, { name: "U2", email: "U2@college.edu" }, "org", at(3));
    expect(a.registration.user_id).toBe("u2");
    expect(b.alreadyIn).toBe(true);
  });
});

describe("team sign-up", () => {
  it("captain creates a team with a code; teammates join until it's full", async () => {
    const e = await addEvent(50);
    for (const n of [1, 2, 3, 4]) await addUser(1000 + n).catch(() => {});
    const reg = async (u: string, m: number) => {
      const r = await register(db, e, u, { now: at(m) });
      if (r.kind === "full") throw new Error("full");
      return r;
    };
    const cap = await reg("u1001", 0);
    const team = await createTeam(db, e.id, "u1001", cap.registration.id, "  Byte   Me ");
    expect(team.name).toBe("Byte Me");
    expect(team.join_code).toMatch(/^[A-Z0-9]{6}$/);
    expect(await teamNameTaken(db, e.id, "byte me")).toBe(true);
    await expect(createTeam(db, e.id, "u1001", cap.registration.id, "BYTE ME")).rejects.toThrow("name_taken");

    const found = await teamByCode(db, e.id, team.join_code.toLowerCase());
    expect(found?.members).toBe(1);
    const r2 = await reg("u1002", 1);
    const r3 = await reg("u1003", 2);
    expect(await joinTeam(db, team.id, r2.registration.id, 2)).toBe(true);
    expect(await joinTeam(db, team.id, r3.registration.id, 2)).toBe(false); // max 2: full

    const mine = await myTeam(db, r2.registration.id, "u1002");
    expect(mine?.members.map((m) => [m.captain, m.you])).toEqual([
      [true, false],
      [false, true],
    ]);
    expect(mine?.isCaptain).toBe(false);
  });
});
