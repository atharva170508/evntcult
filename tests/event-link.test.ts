/** The optional event link: validation and saving. */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { testDatabase } from "./helpers/d1";
import { createDraft, saveEvent, duplicateEvent } from "@/lib/data/organizer-events";
import { isValidLink, linkLabel } from "@/lib/organizer/shared";
import { saveEventSchema } from "@/lib/validation";

let db: D1Database;
let dispose: () => Promise<void>;
const now = new Date("2026-11-20T06:30:00.000Z");
const org = { id: "org", role: "organizer" as const };
const admin = { id: "adm", role: "admin" as const };
const link = async (id: string) => (await db.prepare("SELECT link_url FROM events WHERE id = ?").bind(id).first<{ link_url: string | null }>())!.link_url;

beforeAll(async () => {
  ({ db, dispose } = await testDatabase());
  await db.batch(["org", "adm"].map((id) => db.prepare("INSERT INTO users (id, email, name, role, created_at) VALUES (?, ?, ?, ?, ?)").bind(id, `${id}@college.edu`, id, id === "org" ? "organizer" : "admin", now.toISOString())));
}, 60_000);
afterAll(() => dispose());

describe("event link", () => {
  it("only accepts http and https", () => {
    expect(isValidLink("https://instagram.com/yourclub")).toBe(true);
    expect(isValidLink("http://x.co")).toBe(true);
    expect(isValidLink("instagram.com/yourclub")).toBe(false);
  });

  it("broken on purpose: script links and spaces are refused, and so is an over-long link", () => {
    expect(isValidLink("javascript:alert(1)")).toBe(false);
    expect(isValidLink("https://a b.com")).toBe(false);
    expect(isValidLink(`https://x.co/${"a".repeat(300)}`)).toBe(false);
    expect(saveEventSchema.safeParse({ version: 1, linkUrl: "javascript:alert(1)" }).success).toBe(false);
  });

  it("shows without the https:// and without a trailing slash", () => {
    expect(linkLabel("https://instagram.com/yourclub/")).toBe("instagram.com/yourclub");
    expect(linkLabel("http://x.co")).toBe("x.co");
  });

  it("empty stores NULL, a link saves and can be cleared, for organizer and admin", async () => {
    const d = await createDraft(db, org, { title: "One", date: "2026-12-20" }, now);
    expect(await link(d.id)).toBeNull();
    const a = await saveEvent(db, org, d.id, 1, { linkUrl: "https://x.co/a" }, now);
    expect(await link(d.id)).toBe("https://x.co/a");
    const b = await saveEvent(db, admin, d.id, a.version, { linkUrl: "https://x.co/b" }, now);
    expect(await link(d.id)).toBe("https://x.co/b");
    const c = await saveEvent(db, org, d.id, b.version, { tagline: "Other field" }, now);
    expect(await link(d.id)).toBe("https://x.co/b");
    await saveEvent(db, org, d.id, c.version, { linkUrl: null }, now);
    expect(await link(d.id)).toBeNull();
  });

  it("is set on create and kept when duplicated", async () => {
    const d = await createDraft(db, org, { title: "Two", date: "2026-12-21", linkUrl: "https://x.co/two" }, now);
    expect(await link(d.id)).toBe("https://x.co/two");
    const copy = await duplicateEvent(db, org, d.id, now);
    expect(await link(copy.id)).toBe("https://x.co/two");
  });
});
