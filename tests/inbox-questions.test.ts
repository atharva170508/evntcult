/** The notification bell and registration questions. */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { testDatabase } from "./helpers/d1";
import { inbox, markAllRead } from "@/lib/data/inbox";
import { enqueueOne, flush, queueTest } from "@/lib/whatsapp";
import { cleanAnswers, createQuestion, deleteQuestion, eventAnswers, listQuestions, saveAnswers, MAX_QUESTIONS } from "@/lib/data/questions";

let db: D1Database;
let dispose: () => Promise<void>;
const T0 = new Date("2026-12-01T08:30:00.000Z");

beforeAll(async () => {
  ({ db, dispose } = await testDatabase());
  const at = T0.toISOString();
  await db.batch([
    db.prepare("INSERT INTO users (id, email, name, role, created_at, phone, whatsapp_opt_in) VALUES ('wa', 'wa@x.co', 'W', 'attendee', ?, '+919800000001', 1)").bind(at),
    db.prepare("INSERT INTO users (id, email, name, role, created_at) VALUES ('site', 's@x.co', 'S', 'attendee', ?)").bind(at),
    db.prepare("INSERT INTO users (id, email, name, role, created_at) VALUES ('org', 'o@x.co', 'O', 'organizer', ?)").bind(at),
    db.prepare("INSERT INTO events (id, slug, title, category, venue, starts_at, ends_at, capacity, price_paise, status, organizer_id, created_at) VALUES ('ev', 'ev', 'Night', 'PARTY', 'Hall', '2026-12-05T14:00:00.000Z', '2026-12-05T17:00:00.000Z', 50, 0, 'published', 'org', ?)").bind(at),
    db.prepare("INSERT INTO registrations (id, event_id, user_id, status, pass_code, pass_token, payment_status, created_at) VALUES ('r1', 'ev', 'wa', 'registered', 'P1', 't1', 'unpaid', ?)").bind(at),
    db.prepare("INSERT INTO registrations (id, event_id, user_id, status, pass_code, pass_token, payment_status, created_at) VALUES ('r2', 'ev', 'site', 'registered', 'P2', 't2', 'unpaid', ?)").bind(at),
  ]);
}, 60_000);
afterAll(() => dispose());

describe("bell", () => {
  it("shows for WhatsApp users and for people with no number at all", async () => {
    await enqueueOne(db, "wa", "ev", "pass_confirmed", "p:r1", T0);
    await enqueueOne(db, "site", "ev", "pass_confirmed", "p:r2", T0);
    await flush(db, {}, T0);
    for (const u of ["wa", "site"]) {
      const box = await inbox(db, u, T0);
      expect(box.unread).toBe(1);
      expect(box.items[0]).toMatchObject({ text: "Your pass for Night is confirmed.", href: "/events/ev", read: false });
    }
  });

  it("opening it clears the count, only for that person", async () => {
    await markAllRead(db, "wa", T0);
    expect((await inbox(db, "wa", T0)).unread).toBe(0);
    expect((await inbox(db, "site", T0)).unread).toBe(1);
  });

  it("broken on purpose: queued, withdrawn and test messages stay out", async () => {
    await enqueueOne(db, "site", "ev", "event_reminder", "later:r2", new Date(T0.getTime() + 3_600_000));
    await db.prepare("UPDATE registrations SET status = 'cancelled' WHERE id = 'r1'").run();
    await enqueueOne(db, "wa", "ev", "event_reminder", "gone:r1", T0);
    await queueTest(db, "wa", "ev", T0);
    await flush(db, {}, T0);
    expect((await inbox(db, "site", T0)).items).toHaveLength(1);
    expect((await inbox(db, "wa", T0)).items).toHaveLength(1);
  });
});

describe("questions", () => {
  const q = { id: "q", label: "Size", kind: "choice" as const, options: ["S", "M"], required: true };
  it("a required answer is enforced, and a choice must be on the list", () => {
    expect(() => cleanAnswers([q], {})).toThrow("Please answer: Size");
    expect(() => cleanAnswers([q], { q: "XXL" })).toThrow("Pick one");
    expect(cleanAnswers([q], { q: "M" })).toEqual({ q: "M" });
  });

  it("broken on purpose: answers to questions that don't exist are dropped", () => {
    expect(cleanAnswers([q], { q: "S", fake: "hack" })).toEqual({ q: "S" });
  });

  it("a choice needs two options, and an event has a limit", async () => {
    await expect(createQuestion(db, "ev", { label: "x", kind: "choice", options: ["only", " only "] }, T0)).rejects.toMatchObject({ code: "need_options" });
    for (let i = 0; i < MAX_QUESTIONS; i++) await createQuestion(db, "ev", { label: `Q${i}`, kind: "text" }, T0);
    await expect(createQuestion(db, "ev", { label: "more", kind: "text" }, T0)).rejects.toMatchObject({ code: "too_many" });
  });

  it("answers save, can be updated, and protect their question", async () => {
    const [first] = await listQuestions(db, "ev");
    await saveAnswers(db, "r2", { [first.id]: "One" });
    await saveAnswers(db, "r2", { [first.id]: "Two" });
    expect((await eventAnswers(db, "ev")).get("r2")).toEqual({ [first.id]: "Two" });
    await expect(deleteQuestion(db, "ev", first.id)).rejects.toMatchObject({ code: "has_answers" });
  });
});
