/** Organizer dashboard rules, against a real local D1. Includes the cases meant to break it. */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { testDatabase } from "./helpers/d1";
import { codeAvailable, createDraft, duplicateEvent, publishEvent, resolveShortCode, saveEvent, unpublishEvent, CODE_MISS_LIMIT } from "@/lib/data/organizer-events";
import { endsLabel, isMultiDay, isValidUpi, layoutMonth, missingForPublish, slugify, type CalendarEvent } from "@/lib/organizer/shared";

let db: D1Database;
let dispose: () => Promise<void>;
const now = new Date("2026-11-01T06:00:00.000Z");
const org = { id: "org", role: "organizer" };
const ABOUT = "A full evening of music and food on the main lawn.";

beforeAll(async () => {
  ({ db, dispose } = await testDatabase());
  for (const [id, role] of [["org", "organizer"], ["org2", "organizer"], ["kid", "attendee"], ["kid2", "attendee"]])
    await db.prepare("INSERT INTO users (id, email, name, role, created_at) VALUES (?, ?, 'N', ?, ?)").bind(id, `${id}@x.edu`, role, now.toISOString()).run();
}, 60_000);
afterAll(() => dispose());

let n = 0;
const draft = (extra = {}) => createDraft(db, org, { title: `Event ${++n}`, date: `2026-12-${String((n % 27) + 1).padStart(2, "0")}`, venue: `Hall ${n}`, category: "TECH", description: ABOUT, ...extra }, now);
const row = (id: string) => db.prepare("SELECT * FROM events WHERE id = ?").bind(id).first<Record<string, unknown>>();

describe("drafts", () => {
  it("applies the defaults: 18:00 IST, 2 hours, 100 seats, free, public", async () => {
    const d = await createDraft(db, org, { title: "Defaults", date: "2026-12-20" }, now);
    expect(await row(d.id)).toMatchObject({ status: "draft", version: 1, capacity: 100, price_paise: 0, access: "public", starts_at: "2026-12-20T12:30:00.000Z", ends_at: "2026-12-20T14:30:00.000Z" });
  });
  it("blank capacity stores NULL", async () => {
    const d = await draft({ capacity: null });
    expect((await row(d.id))!.capacity).toBeNull();
  });
  it("uses the last venue when none is given", async () => {
    await draft({ venue: "Back gate lawn, Koramangala" });
    const d = await createDraft(db, org, { title: "Next one", date: "2026-12-21" }, now);
    expect((await row(d.id))!.venue).toBe("Back gate lawn, Koramangala");
  });
  it("slugs collide to -2", async () => {
    const a = await createDraft(db, org, { title: "Garba Night!!", date: "2026-12-22" }, now);
    const b = await createDraft(db, org, { title: "garba night", date: "2026-12-22" }, now);
    expect([a.slug, b.slug]).toEqual(["garba-night", "garba-night-2"]);
  });
  it("a student becomes an organizer by hosting, once", async () => {
    await createDraft(db, { id: "kid", role: "attendee" }, { title: "Open mic", date: "2026-12-23" }, now);
    expect((await db.prepare("SELECT role FROM users WHERE id = 'kid'").first<{ role: string }>())!.role).toBe("organizer");
  });
});

describe("autosave", () => {
  it("bumps the version and writes the audit log", async () => {
    const d = await draft();
    expect((await saveEvent(db, org, d.id, 1, { tagline: "Hello" }, now)).version).toBe(2);
    const a = await db.prepare("SELECT COUNT(*) n FROM audit_log WHERE target_id = ? AND action = 'event_update'").bind(d.id).first<{ n: number }>();
    expect(a!.n).toBe(1);
  });
  it("two tabs: the older save gets a 409 and changes nothing", async () => {
    const d = await draft();
    await saveEvent(db, org, d.id, 1, { title: "Tab one" }, now);
    await expect(saveEvent(db, org, d.id, 1, { title: "Tab two" }, now)).rejects.toMatchObject({ status: 409, code: "version_conflict" });
    expect((await row(d.id))!.title).toBe("Tab one");
  });
  it("3h moves the end, keeping the start", async () => {
    const d = await draft();
    await saveEvent(db, org, d.id, 1, { durationMinutes: 180 }, now);
    const r = (await row(d.id))!;
    expect(Date.parse(r.ends_at as string) - Date.parse(r.starts_at as string)).toBe(3 * 3_600_000);
  });
  it("moving only the date keeps time and length", async () => {
    const d = await createDraft(db, org, { title: "Move me", date: "2026-12-24", time: "19:15", durationMinutes: 90 }, now);
    await saveEvent(db, org, d.id, 1, { date: "2026-12-26" }, now);
    expect(await row(d.id)).toMatchObject({ starts_at: "2026-12-26T13:45:00.000Z", ends_at: "2026-12-26T15:15:00.000Z" });
  });
  it("broken on purpose: someone else can't save over it", async () => {
    const d = await draft();
    await expect(saveEvent(db, { id: "org2", role: "organizer" }, d.id, 1, { title: "Hacked" }, now)).rejects.toMatchObject({ status: 403 });
    expect((await row(d.id))!.title).not.toBe("Hacked");
  });
  it("broken on purpose: a typed SQL string is stored as plain text", async () => {
    const d = await draft();
    await saveEvent(db, org, d.id, 1, { title: "x'; DROP TABLE events; --" }, now);
    expect((await row(d.id))!.title).toBe("x'; DROP TABLE events; --");
  });
  it("capacity can't go below seats taken", async () => {
    const d = await draft({ capacity: 5 });
    await db.prepare("INSERT INTO registrations (id, event_id, user_id, status, pass_code, pass_token, payment_status, created_at) VALUES (?, ?, 'kid2', 'registered', 'P', ?, 'unpaid', ?)").bind(`r-${d.id}`, d.id, `T-${d.id}`, now.toISOString()).run();
    await saveEvent(db, org, d.id, 1, { capacity: 1 }, now);
    await db.prepare("INSERT INTO registrations (id, event_id, user_id, status, pass_code, pass_token, payment_status, created_at) VALUES (?, ?, 'org2', 'registered', 'Q', ?, 'unpaid', ?)").bind(`s-${d.id}`, d.id, `U-${d.id}`, now.toISOString()).run();
    await expect(saveEvent(db, org, d.id, 2, { capacity: 1 }, now)).rejects.toMatchObject({ code: "capacity_below_registrations" });
  });
});

describe("publish", () => {
  it("returns exactly what's missing", async () => {
    const d = await createDraft(db, org, { title: "Bare", date: "2026-12-25", venue: null, pricePaise: 5000, access: "public" }, now);
    await expect(publishEvent(db, org, d.id, 1, {}, now)).rejects.toMatchObject({ status: 422, extra: { missing: ["payout"] } });
  });
  it("TBA needs no venue, and free needs no UPI", async () => {
    const d = await draft({ venue: null, venueStatus: "tba" });
    expect((await publishEvent(db, org, d.id, 1, {}, now)).version).toBe(2);
    expect(await row(d.id)).toMatchObject({ status: "published", published_at: now.toISOString() });
  });
  it("won't double-book a room", async () => {
    const a = await draft({ venue: "Seminar Hall 2", date: "2026-12-28" });
    await publishEvent(db, org, a.id, 1, {}, now);
    const b = await draft({ venue: "Seminar Hall 2", date: "2026-12-28" });
    await expect(publishEvent(db, org, b.id, 1, {}, now)).rejects.toMatchObject({ status: 409, code: "venue_clash" });
  });
  it("unpublish keeps the code; publish again works", async () => {
    const d = await draft({ access: "code", accessCode: "garba26" });
    const p = await publishEvent(db, org, d.id, 1, {}, now);
    const u = await unpublishEvent(db, org, d.id, p.version, now);
    expect(await row(d.id)).toMatchObject({ status: "draft", access_code: "GARBA26" });
    await publishEvent(db, org, d.id, u.version, {}, now);
  });
  it("won't unpublish once someone holds a pass", async () => {
    const d = await draft();
    const p = await publishEvent(db, org, d.id, 1, {}, now);
    await db.prepare("INSERT INTO registrations (id, event_id, user_id, status, pass_code, pass_token, payment_status, created_at) VALUES (?, ?, 'kid2', 'registered', 'P2', ?, 'unpaid', ?)").bind(`h-${d.id}`, d.id, `H-${d.id}`, now.toISOString()).run();
    await expect(unpublishEvent(db, org, d.id, p.version, now)).rejects.toMatchObject({ code: "has_registrations" });
  });
  it("duplicate is a prefilled draft without the code", async () => {
    const d = await draft({ access: "code", accessCode: "dupme1", tagline: "Keep me" });
    const c = await duplicateEvent(db, org, d.id, now);
    expect(await row(c.id)).toMatchObject({ status: "draft", version: 1, tagline: "Keep me", access: "public", access_code: null });
  });
});

describe("older published events", () => {
  const legacy = async () => {
    const d = await draft();
    const p = await publishEvent(db, org, d.id, 1, {}, now);
    // As on the live site: paid, no UPI, short About, made before these rules existed.
    await db.prepare("UPDATE events SET price_paise = 10000, organizer_upi_id = NULL, description = 'Short' WHERE id = ?").bind(d.id).run();
    return { id: d.id, version: p.version };
  };
  it("stay editable even though they'd fail publish today", async () => {
    const e = await legacy();
    expect((await saveEvent(db, org, e.id, e.version, { tagline: "Edited" }, now)).version).toBe(e.version + 1);
  });
  it("can be moved to another day", async () => {
    const e = await legacy();
    await expect(saveEvent(db, org, e.id, e.version, { date: "2026-12-30" }, now)).resolves.toBeTruthy();
  });
  it("still can't have something required newly removed", async () => {
    const d = await draft({ pricePaise: 5000, payoutUpi: "club@okaxis" });
    const p = await publishEvent(db, org, d.id, 1, {}, now);
    await expect(saveEvent(db, org, d.id, p.version, { payoutUpi: null }, now)).rejects.toMatchObject({ status: 422, extra: { missing: ["payout"] } });
  });
});

describe("the bare minimum", () => {
  it("a name alone can go live, with the venue shown as TBA", async () => {
    const d = await createDraft(db, org, { title: "Just a name", date: "2026-12-29", venue: null }, now);
    await publishEvent(db, org, d.id, 1, {}, now);
    expect(await row(d.id)).toMatchObject({ status: "published", category: null, description: null, venue: null, venue_status: "tba" });
  });
});

describe("publishing the past", () => {
  it("refuses an event that has already ended", async () => {
    const d = await draft({ date: "2026-10-01" });
    await expect(publishEvent(db, org, d.id, 1, {}, now)).rejects.toMatchObject({ status: 422, code: "ended" });
  });
});

describe("codes and short links", () => {
  it("two events can't claim one code, whichever way it's cased", async () => {
    await draft({ access: "code", accessCode: "SAMECODE" });
    await expect(draft({ access: "code", accessCode: "same-code" })).rejects.toMatchObject({ status: 409, code: "code_taken" });
    const other = await draft();
    await expect(saveEvent(db, org, other.id, 1, { access: "code", accessCode: "samecode" }, now)).rejects.toMatchObject({ code: "code_taken" });
    expect(await codeAvailable(db, "samecode")).toBe(false);
    expect(await codeAvailable(db, "freecode")).toBe(true);
  });
  it("/c/:code goes to a published event only", async () => {
    const d = await draft({ access: "code", accessCode: "linkme" });
    expect(await resolveShortCode(db, "linkme", "1.1.1.1", now)).toBeNull();
    await publishEvent(db, org, d.id, 1, {}, now);
    expect(await resolveShortCode(db, "LINKME", "1.1.1.1", now)).toContain("code=LINKME");
  });
  it("broken on purpose: guessing codes gets blocked after 20 misses, only for that IP", async () => {
    for (let i = 0; i < CODE_MISS_LIMIT; i++) await resolveShortCode(db, `nope${i}`, "6.6.6.6", now);
    await expect(resolveShortCode(db, "nope", "6.6.6.6", now)).rejects.toMatchObject({ status: 429 });
    await expect(resolveShortCode(db, "nope", "7.7.7.7", now)).resolves.toBeNull();
    await expect(resolveShortCode(db, "nope", "6.6.6.6", new Date(now.getTime() + 61_000))).resolves.toBeNull();
  });
});

const ev = (id: string, starts_at: string, ends_at: string): CalendarEvent => ({ id, slug: id, title: id, venue: "V", starts_at, ends_at, status: "published", capacity: 10, taken: 0, version: 1, clash: false });

describe("pure rules", () => {
  it("slugify", () => {
    expect(slugify("  HackFest: 2026!! ")).toBe("hackfest-2026");
    expect(slugify("!!!")).toBe("event");
    expect(slugify("a".repeat(90)).length).toBe(60);
  });
  it("ends label", () => {
    expect(endsLabel("2026-11-07", "18:00", 120)).toBe("ends 20:00");
    expect(endsLabel("2026-11-07", "18:00", 180)).toBe("ends 21:00");
    expect(endsLabel("2026-11-07", "23:00", 180)).toBe("ends 02:00 +1");
  });
  it("UPI", () => {
    expect(isValidUpi("club.lead@okaxis")).toBe(true);
    for (const v of ["club", "club@", "@okaxis", "a b@ok"]) expect(isValidUpi(v)).toBe(false);
  });
  it("code-only events need a code; paid needs payout", () => {
    const base = { title: "T", category: "TECH", venue: "V", venue_status: "confirmed", description: ABOUT, price_paise: 0, organizer_upi_id: null, access: "public", access_code: null };
    expect(missingForPublish(base)).toEqual([]);
    expect(missingForPublish({ ...base, access: "code" })).toEqual(["code"]);
    expect(missingForPublish({ ...base, description: null, category: null, venue: null })).toEqual([]);
    expect(missingForPublish({ ...base, price_paise: 100 })).toEqual(["payout"]);
  });
  it("5 events in a day: 2 chips and +3 more", () => {
    const list = [1, 2, 3, 4, 5].map((i) => ev(`e${i}`, `2026-11-10T0${i}:00:00.000Z`, `2026-11-10T0${i}:30:00.000Z`));
    const cell = layoutMonth(2026, 10, list).flatMap((w) => w.cells).find((c) => c.date === "2026-11-10")!;
    expect(cell.chips.length).toBe(2);
    expect(cell.more).toBe(3);
    expect(cell.all.length).toBe(5);
  });
  it("a 3-day event is one bar, never chips", () => {
    const e = ev("fest", "2026-11-18T06:00:00.000Z", "2026-11-20T16:00:00.000Z");
    const weeks = layoutMonth(2026, 10, [e]);
    expect(weeks.flatMap((w) => w.bars)).toMatchObject([{ startCol: 2, span: 3, continuation: false }]);
    expect(weeks.flatMap((w) => w.cells).flatMap((c) => c.chips)).toEqual([]);
  });
  it("a bar crossing a week continues as a stub", () => {
    const e = ev("long", "2026-11-14T06:00:00.000Z", "2026-11-17T16:00:00.000Z");
    expect(layoutMonth(2026, 10, [e]).flatMap((w) => w.bars).map((b) => b.continuation)).toEqual([false, true]);
  });
  it("an all-nighter is one night, not a multi-day bar", () => {
    expect(isMultiDay(ev("n", "2026-11-14T15:30:00.000Z", "2026-11-14T22:30:00.000Z"))).toBe(false);
  });
  it("November 2026 lays out Monday-first with no out-of-month chips", () => {
    const weeks = layoutMonth(2026, 10, [ev("x", "2026-12-01T06:00:00.000Z", "2026-12-01T08:00:00.000Z")]);
    expect(weeks[0].cells[0].date).toBe("2026-10-26");
    expect(weeks.flatMap((w) => w.cells).flatMap((c) => c.chips)).toEqual([]);
  });
});
