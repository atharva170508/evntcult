/** Deleting a draft: drafts only, owners/organizers only, and nothing left behind. */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { testDatabase } from "./helpers/d1";
import { EVENT_CHILD_DELETES, createDraft, deleteDraft, publishEvent } from "@/lib/data/organizer-events";

let db: D1Database;
let dispose: () => Promise<void>;
const now = new Date("2026-11-01T06:00:00.000Z");
const iso = now.toISOString();
const org = { id: "org", role: "organizer" };
const ABOUT = "A long enough description so the event can be published without complaints from the checks.";

beforeAll(async () => {
  ({ db, dispose } = await testDatabase());
  for (const [id, role] of [["org", "organizer"], ["stu", "attendee"]])
    await db.prepare("INSERT INTO users (id, email, name, role, created_at) VALUES (?, ?, 'N', ?, ?)").bind(id, `${id}@x.edu`, role, iso).run();
}, 60_000);
afterAll(() => dispose?.());

const count = async (sql: string, ...args: unknown[]) => (await db.prepare(sql).bind(...args).first<{ n: number }>())!.n;

describe("deleteDraft", { timeout: 30_000 }, () => {
  it("removes a draft and everything attached to it", async () => {
    const d = await createDraft(db, org, { title: "Test draft", date: "2026-12-20" }, now);
    await db.batch([
      db.prepare("INSERT INTO event_questions (id, event_id, label, created_at) VALUES ('q1', ?, 'T-shirt size', ?)").bind(d.id, iso),
      db.prepare("INSERT INTO merch_items (id, event_id, name, created_at) VALUES ('m1', ?, 'Tee', ?)").bind(d.id, iso),
      db.prepare("INSERT INTO event_saves (user_id, event_id, created_at) VALUES ('stu', ?, ?)").bind(d.id, iso),
      db.prepare("INSERT INTO event_posters (event_id, mime, data, updated_at) VALUES (?, 'image/webp', x'00', ?)").bind(d.id, iso),
    ]);
    await expect(deleteDraft(db, org, d.id, now)).resolves.toEqual({ ok: true });
    expect(await count("SELECT COUNT(*) AS n FROM events WHERE id = ?", d.id)).toBe(0);
    for (const t of ["event_questions", "merch_items", "event_saves", "event_posters"]) expect(await count(`SELECT COUNT(*) AS n FROM ${t} WHERE event_id = ?`, d.id)).toBe(0);
    expect(await count("SELECT COUNT(*) AS n FROM audit_log WHERE action = 'event_delete_draft' AND target_id = ?", d.id)).toBe(1);
  });

  it("won't delete a published event (cancel it instead)", async () => {
    const d = await createDraft(db, org, { title: "Live one", date: "2026-12-21", time: "18:00", venue: "Hall 1", category: "TECH", description: ABOUT }, now);
    await publishEvent(db, org, d.id, d.version, {}, now);
    await expect(deleteDraft(db, org, d.id, now)).rejects.toMatchObject({ status: 409, code: "not_draft" });
    expect(await count("SELECT COUNT(*) AS n FROM events WHERE id = ?", d.id)).toBe(1);
  });

  it("is for organizers only", async () => {
    const d = await createDraft(db, org, { title: "Mine", date: "2026-12-22" }, now);
    await expect(deleteDraft(db, { id: "stu", role: "attendee" }, d.id, now)).rejects.toMatchObject({ status: 403, code: "not_approved" });
    expect(await count("SELECT COUNT(*) AS n FROM events WHERE id = ?", d.id)).toBe(1);
  });

  it("says not found for a missing event", async () => {
    await expect(deleteDraft(db, org, "nope", now)).rejects.toMatchObject({ status: 404 });
  });

  it("covers every table that stores an event_id", async () => {
    const tables = await db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' AND name != 'd1_migrations'").all<{ name: string }>();
    const withEventId: string[] = [];
    for (const { name } of tables.results) {
      const cols = await db.prepare(`SELECT name FROM pragma_table_info('${name}')`).all<{ name: string }>();
      if (cols.results.some((c) => c.name === "event_id")) withEventId.push(name);
    }
    const covered = EVENT_CHILD_DELETES.join("\n");
    const missing = withEventId.filter((t) => !covered.includes(`DELETE FROM ${t} WHERE event_id`));
    expect(missing, "add these tables to EVENT_CHILD_DELETES in organizer-events.ts").toEqual([]);
  });
});
