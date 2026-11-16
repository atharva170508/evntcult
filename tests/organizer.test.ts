/** M4: WhatsApp outbox, payment reconcile, event updates, attendee list and CSV (real local D1). */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { testDatabase } from "./helpers/d1";
import { outboxCounts, notifyUser } from "@/lib/notify";
import { attendeesCsv, csvCell, listAttendees, postEventUpdate, setPayment } from "@/lib/data/organizer-actions";
import { cancel, register, type EventForRegistration } from "@/lib/data/registrations";

let db: D1Database;
let dispose: () => Promise<void>;
const T0 = new Date("2026-11-20T06:30:00.000Z"); // 12:00 IST
const at = T0.toISOString();

const event: EventForRegistration = {
  id: "ev1",
  slug: "neon-night",
  capacity: 3,
  status: "published",
  starts_at: "2026-11-20T14:00:00.000Z", // 7:30 pm IST, within 24 h of T0
  ends_at: "2026-11-20T18:00:00.000Z",
};

beforeAll(async () => {
  ({ db, dispose } = await testDatabase());
  const users: [string, string, string | null, number][] = [
    ["org", "Org", null, 0],
    ["a", "Asha Rao", "+919800000001", 1], // opted in
    ["b", "Bilal Khan", "+919800000002", 0], // has a number but didn't tick consent
    ["c", "Chitra Nair", null, 1], // ticked consent but no number
    ["d", "=HYPERLINK(\"evil\")", "+919800000004", 1], // opted in; nasty name for the CSV test
    ["e", "Esha Patel", "+919800000005", 1], // will be on the waitlist
  ];
  await db.batch(
    users.map(([id, name, phone, opt]) =>
      db.prepare("INSERT INTO users (id, email, name, role, created_at, phone, whatsapp_opt_in) VALUES (?, ?, ?, ?, ?, ?, ?)").bind(id, `${id}@college.edu`, name, id === "org" ? "organizer" : "attendee", at, phone, opt),
    ),
  );
  await db
    .prepare(
      `INSERT INTO events (id, slug, title, category, venue, starts_at, ends_at, capacity, price_paise, status, organizer_id, created_at)
       VALUES ('ev1', 'neon-night', 'Neon Night', 'PARTY', 'Main Auditorium', ?, ?, 3, 29900, 'published', 'org', ?)`,
    )
    .bind(event.starts_at, event.ends_at, at)
    .run();
  for (const [i, u] of ["a", "b", "c"].entries()) await register(db, event, u, { now: new Date(T0.getTime() - (10 - i) * 60_000) });
  await register(db, event, "d", { waitlist: true, now: new Date(T0.getTime() - 5 * 60_000) });
  await register(db, event, "e", { waitlist: true, now: new Date(T0.getTime() - 4 * 60_000) });
}, 60_000);
afterAll(async () => dispose?.());

const outbox = async () =>
  (await db.prepare("SELECT user_id, template, payload, dedupe_key FROM notifications ORDER BY created_at, user_id").all<{ user_id: string; template: string; payload: string; dedupe_key: string }>()).results ?? [];

describe("WhatsApp outbox", { timeout: 30_000 }, () => {
  it("an event update is queued only for registered students who opted in and have a number", async () => {
    const r = await postEventUpdate(db, { eventId: "ev1", actorId: "org", kind: "venue", body: "Moved to the OAT.\nGate 3.", whatsapp: true }, T0);
    expect(r.queued).toBe(1); // a: yes · b: no consent · c: no number · d, e: waitlisted
    const rows = (await outbox()).filter((n) => n.template === "event_update");
    expect(rows.map((n) => n.user_id)).toEqual(["a"]);
    expect(JSON.parse(rows[0].payload)).toEqual({ event_title: "Neon Night", message: "Venue change: Moved to the OAT. Gate 3." });
  });

  it("no phone numbers are ever copied into the outbox", async () => {
    const all = JSON.stringify(await outbox());
    expect(all).not.toMatch(/\+91|98000/);
  });

  it("updates can skip WhatsApp, and still show on the event", async () => {
    const r = await postEventUpdate(db, { eventId: "ev1", actorId: "org", kind: "update", body: "Snacks at 8.", whatsapp: false }, T0);
    expect(r.queued).toBe(0);
    const row = await db.prepare("SELECT notified FROM event_updates WHERE id = ?").bind(r.id).first<{ notified: number }>();
    expect(row?.notified).toBe(0);
  });

  it("a waitlist hold queues a waitlist_offer message for the person who got the seat", async () => {
    const asha = await db.prepare("SELECT id FROM registrations WHERE user_id = 'a'").first<{ id: string }>();
    await cancel(db, asha!.id, "a", T0); // d (=HYPERLINK…) is first on the waitlist and opted in
    const hold = (await outbox()).find((n) => n.template === "waitlist_offer")!;
    expect(hold.user_id).toBe("d");
    expect(JSON.parse(hold.payload)).toMatchObject({ event_title: "Neon Night", link: "/events/neon-night" });
  });

  it("notifyUser queues for anyone, and never queues the same key twice", async () => {
    expect(await notifyUser(db, "b", "ev1", "waitlist_offer", { event_title: "x", confirm_by: "y", link: "z" }, "test:b", T0)).toBe(true);
    expect(await notifyUser(db, "e", "ev1", "waitlist_offer", { event_title: "x", confirm_by: "y", link: "z" }, "test:e", T0)).toBe(true);
    expect(await notifyUser(db, "e", "ev1", "waitlist_offer", { event_title: "x", confirm_by: "y", link: "z" }, "test:e", T0)).toBe(false);
  });

  it("counts what's waiting in the outbox", async () => {
    const c = await outboxCounts(db, ["ev1"]);
    expect(c).toEqual({ queued: (await outbox()).length, sent: 0, failed: 0 });
    expect(await outboxCounts(db, [])).toEqual({ queued: 0, sent: 0, failed: 0 });
  });
});

describe("payments", { timeout: 30_000 }, () => {
  it("mark paid with a method, then undo, and both are in the audit log", async () => {
    const bilal = (await db.prepare("SELECT id FROM registrations WHERE user_id = 'b'").first<{ id: string }>())!.id;
    await setPayment(db, bilal, "org", { status: "paid", method: "upi", ref: "412345678901" }, T0);
    let r = await db.prepare("SELECT payment_status, payment_method, payment_ref, paid_by FROM registrations WHERE id = ?").bind(bilal).first();
    expect(r).toEqual({ payment_status: "paid", payment_method: "upi", payment_ref: "412345678901", paid_by: "org" });

    await setPayment(db, bilal, "org", { status: "unpaid" }, T0);
    r = await db.prepare("SELECT payment_status, payment_method, payment_ref, paid_by FROM registrations WHERE id = ?").bind(bilal).first();
    expect(r).toEqual({ payment_status: "unpaid", payment_method: null, payment_ref: null, paid_by: null });

    const audits = (await db.prepare("SELECT meta FROM audit_log WHERE action = 'payment' AND target_id = ? ORDER BY created_at").bind(bilal).all<{ meta: string }>()).results!;
    expect(audits.map((a) => JSON.parse(a.meta))).toEqual([
      { event_id: "ev1", from: "unpaid", to: "paid", method: "upi", ref: "412345678901" },
      { event_id: "ev1", from: "paid", to: "unpaid" },
    ]);
  });

  it("refuses free events and unknown registrations", async () => {
    await expect(setPayment(db, "nope", "org", { status: "unpaid" }, T0)).rejects.toMatchObject({ code: "not_found" });
    await db.prepare("UPDATE events SET price_paise = 0 WHERE id = 'ev1'").run();
    const c = (await db.prepare("SELECT id FROM registrations WHERE user_id = 'c'").first<{ id: string }>())!.id;
    await expect(setPayment(db, c, "org", { status: "paid", method: "cash" }, T0)).rejects.toMatchObject({ code: "free_event" });
    await db.prepare("UPDATE events SET price_paise = 29900 WHERE id = 'ev1'").run();
  });
});

describe("attendees and CSV", { timeout: 30_000 }, () => {
  it("lists registered first, then the waitlist, and searches name/email/pass code", async () => {
    const all = await listAttendees(db, "ev1");
    // Asha cancelled above, so: Bilal + Chitra registered; the HYPERLINK user (holding a seat) + Esha waiting.
    expect(all.map((r) => r.status)).toEqual(["registered", "registered", "waitlisted", "waitlisted"]);
    expect((await listAttendees(db, "ev1", "bilal")).map((r) => r.name)).toEqual(["Bilal Khan"]);
    expect((await listAttendees(db, "ev1", "c@college")).map((r) => r.name)).toEqual(["Chitra Nair"]);
    expect(await listAttendees(db, "ev1", "%")).toHaveLength(0); // % is searched literally
  });

  it("the CSV has no phone numbers and defuses spreadsheet formulas", async () => {
    const csv = attendeesCsv(await listAttendees(db, "ev1"), 29900);
    expect(csv.startsWith("﻿Name,Email,Pass code,Status,Checked in (IST),Payment,Method,UPI reference,Paid at (IST),Registered (IST)\r\n")).toBe(true);
    expect(csv).not.toMatch(/\+91|98000|phone/i);
    expect(csv).toContain(`"'=HYPERLINK(""evil"")"`);
    expect(csv.trim().split("\r\n")).toHaveLength(5);
  });

  it("csvCell quotes and escapes", () => {
    expect(csvCell('a,"b"')).toBe('"a,""b"""');
    expect(csvCell("-5")).toBe("'-5");
    expect(csvCell(null)).toBe("");
    expect(csvCell("plain")).toBe("plain");
  });
});
