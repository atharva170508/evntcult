/** Hosting is for approved organizers; the greeting follows India time; the interactive calendar's month payload. */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { applyMigrations, testDatabase } from "./helpers/d1";
import { applyToHost, decideHost, hostStatus, pendingHosts } from "@/lib/data/hosting";
import { createDraft } from "@/lib/data/organizer-events";
import { calendarMonth } from "@/lib/data/calendar";
import { greeting } from "@/lib/greeting";

let db: D1Database;
let dispose: () => Promise<void>;
const now = new Date("2026-11-12T06:00:00.000Z"); // 11:30 IST
const role = async (id: string) => (await db.prepare("SELECT role FROM users WHERE id = ?").bind(id).first<{ role: string }>())!.role;

beforeAll(async () => {
  ({ db, dispose } = await testDatabase());
  for (const [id, r] of [["stu", "attendee"], ["stu2", "attendee"], ["org", "organizer"]])
    await db.prepare("INSERT INTO users (id, email, name, role, created_at) VALUES (?, ?, ?, ?, ?)").bind(id, `${id}@x.edu`, id.toUpperCase(), r, now.toISOString()).run();
  const ev = (id: string, title: string, status: string, access: string, organizer: string, day: string) =>
    db
      .prepare(
        `INSERT INTO events (id, slug, organizer_id, title, category, venue, starts_at, ends_at, capacity, status, access, access_code, created_at, updated_at)
         VALUES (?1, ?1, ?2, ?3, 'TECH', 'Hall', ?4, ?5, 50, ?6, ?7, ?8, ?9, ?9)`,
      )
      .bind(id, organizer, title, `${day}T12:30:00.000Z`, `${day}T14:30:00.000Z`, status, access, access === "code" ? "JAM7K2Q" : null, now.toISOString())
      .run();
  await ev("pub", "Public talk", "published", "public", "org", "2026-11-20");
  await ev("priv", "Private jam", "published", "code", "org", "2026-11-21");
  await ev("draft", "Org draft", "draft", "public", "org", "2026-11-22");
  await ev("dec", "December fest", "published", "public", "org", "2026-12-05");
  await db.prepare("INSERT INTO registrations (id, event_id, user_id, status, pass_code, pass_token, created_at) VALUES ('rg', 'priv', 'stu', 'registered', 'EC-1', 'tok-1', ?)").bind(now.toISOString()).run();
});
afterAll(async () => dispose?.());

describe("hosting is for approved organizers", { timeout: 30_000 }, () => {
  it("a student applies, waits, and can't host while pending", async () => {
    await applyToHost(db, "stu", { club: "Coding Club", note: "Monthly hack nights in the lab." }, now);
    expect(await hostStatus(db, "stu")).toMatchObject({ status: "pending", club: "Coding Club", role: "attendee" });
    await expect(applyToHost(db, "stu", { club: "Again", note: "Applying twice on purpose." }, now)).rejects.toMatchObject({ code: "already_pending" });
    await expect(createDraft(db, { id: "stu", role: "attendee" }, { title: "Hack night", date: "2026-12-01" }, now)).rejects.toMatchObject({ status: 403 });
    expect((await pendingHosts(db)).map((p) => p.id)).toEqual(["stu"]);
  });

  it("approval makes them an organizer, once, and it's audited", async () => {
    await decideHost(db, "stu", true, now);
    expect(await role("stu")).toBe("organizer");
    expect((await hostStatus(db, "stu"))!.status).toBe("approved");
    await expect(decideHost(db, "stu", true, now)).rejects.toMatchObject({ code: "no_change" }); // double-click
    const d = await createDraft(db, { id: "stu", role: "organizer" }, { title: "Hack night", date: "2026-12-01" }, now);
    expect(d.id).toBeTruthy();
    const audit = await db.prepare("SELECT action FROM audit_log WHERE target_id = 'stu' ORDER BY created_at, action").all<{ action: string }>();
    expect(audit.results.map((a) => a.action)).toEqual(expect.arrayContaining(["host_apply", "owner_approve_host", "role_change"]));
  });

  it("a rejection can be followed by a new application; organizers can't apply", async () => {
    await applyToHost(db, "stu2", { club: "Film Club", note: "Screenings on Fridays." }, now);
    await decideHost(db, "stu2", false, now);
    expect(await hostStatus(db, "stu2")).toMatchObject({ status: "rejected", role: "attendee" });
    await applyToHost(db, "stu2", { club: "Film Club", note: "Screenings on Fridays, with the dean's OK." }, now);
    expect((await hostStatus(db, "stu2"))!.status).toBe("pending");
    await expect(applyToHost(db, "org", { club: "X", note: "Already an organizer." }, now)).rejects.toMatchObject({ code: "already_organizer" });
  });

  it("the migration keeps everyone who already hosts; students start with no application", async () => {
    const { getPlatformProxy } = await import("wrangler");
    const proxy = await getPlatformProxy<{ DB: D1Database }>({ persist: false });
    const old = proxy.env.DB;
    await applyMigrations(old, { until: "0019" });
    for (const [id, r] of [["o", "organizer"], ["a", "admin"], ["s", "attendee"]])
      await old.prepare("INSERT INTO users (id, email, name, role, created_at) VALUES (?, ?, 'N', ?, ?)").bind(id, `${id}@x.edu`, r, now.toISOString()).run();
    await applyMigrations(old, { from: "0020" });
    const rows = await old.prepare("SELECT id, host_status FROM users ORDER BY id").all<{ id: string; host_status: string }>();
    expect(rows.results).toEqual([{ id: "a", host_status: "approved" }, { id: "o", host_status: "approved" }, { id: "s", host_status: "none" }]);
    await proxy.dispose();
  });
});

describe("greeting follows the time in India", () => {
  it.each([
    ["2026-11-12T00:30:00Z", "Good morning"], // 06:00 IST
    ["2026-11-12T06:29:00Z", "Good morning"], // 11:59 IST
    ["2026-11-12T06:30:00Z", "Good afternoon"], // 12:00 IST
    ["2026-11-12T11:29:00Z", "Good afternoon"], // 16:59 IST
    ["2026-11-12T11:30:00Z", "Good evening"], // 17:00 IST
    ["2026-11-12T20:00:00Z", "Good evening"], // 01:30 IST — late night still says evening
  ])("%s → %s", (iso, want) => expect(greeting(new Date(iso))).toBe(want));
});

describe("calendar month", { timeout: 30_000 }, () => {
  it("a visitor sees public published events only", async () => {
    const m = await calendarMonth(db, null, "2026-11", now);
    expect(m.events.map((e) => e.id)).toEqual(["pub"]);
    expect(m).toMatchObject({ key: "2026-11", prev: "2026-10", next: "2026-12", today: "2026-11-12", label: "November 2026" });
    expect(m.cells.filter(Boolean)).toHaveLength(30);
  });
  it("a student also sees the private event they registered for, marked as theirs", async () => {
    const m = await calendarMonth(db, "stu2", "2026-11", now);
    expect(m.events.map((e) => e.id)).toEqual(["pub"]);
    const mine = await calendarMonth(db, "stu", "2026-11", now);
    expect(mine.events.find((e) => e.id === "priv")).toMatchObject({ mine: "registered", day: "2026-11-21" });
  });
  it("an organizer sees their own draft, marked as hosting; other months load by key", async () => {
    const m = await calendarMonth(db, "org", "2026-11", now);
    expect(m.events.find((e) => e.id === "draft")).toMatchObject({ hosting: true, status: "draft" });
    expect((await calendarMonth(db, null, "2026-12", now)).events.map((e) => e.id)).toEqual(["dec"]);
    expect((await calendarMonth(db, null, "nonsense", now)).key).toBe("2026-11"); // bad input → this month
  });
});
