/** M5 Photo Vault: upload checks, who can see/tag, tag on/off, delete (real local D1 + R2). */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { testDatabase } from "./helpers/d1";
import { deletePhoto, eventPhotos, myGalleries, myTaggedPhotos, photoAccess, savePhoto, setTag, sniffImageType, MAX_PHOTO_BYTES } from "@/lib/data/photos";

let db: D1Database;
let bucket: R2Bucket;
let dispose: () => Promise<void>;
const at = "2026-11-01T10:00:00.000Z";

const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 16, 74, 70, 73, 70, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0, 0xff, 0xd9]);
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13]);
const WEBP = new Uint8Array([...new TextEncoder().encode("RIFF"), 0, 0, 0, 0, ...new TextEncoder().encode("WEBPVP8 ")]);
const HTML = new TextEncoder().encode("<script>alert(1)</script>");

const who = (id: string, role = "attendee") => ({ id, role });

beforeAll(async () => {
  ({ db, photos: bucket, dispose } = await testDatabase());
  await db.batch([
    ...[["org", "organizer"], ["org2", "organizer"], ["admin", "admin"], ["att", "attendee"], ["wait", "attendee"], ["out", "attendee"]].map(([id, role]) =>
      db.prepare("INSERT INTO users (id, email, name, role, created_at) VALUES (?, ?, ?, ?, ?)").bind(id, `${id}@c.edu`, id, role, at),
    ),
    db.prepare(`INSERT INTO events (id, slug, title, category, venue, starts_at, ends_at, capacity, status, organizer_id, created_at)
                VALUES ('ev', 'fest', 'Fest', 'CULTURAL', 'OAT', '2026-11-02T12:00:00.000Z', '2026-11-02T16:00:00.000Z', 100, 'published', 'org', ?)`).bind(at),
    db.prepare("INSERT INTO registrations (id,event_id,user_id,status,pass_code,pass_token,created_at) VALUES ('r1','ev','att','registered','EC-FEST-0001','AAAAAAAAAAAAAAAAAAAAAAAAAA',?)").bind(at),
    db.prepare("INSERT INTO registrations (id,event_id,user_id,status,pass_code,pass_token,created_at) VALUES ('r2','ev','wait','waitlisted','EC-FEST-0002','BBBBBBBBBBBBBBBBBBBBBBBBBB',?)").bind(at),
  ]);
}, 60_000);
afterAll(async () => dispose?.());

describe("upload checks", () => {
  it("recognises real JPEG / PNG / WebP from their bytes, nothing else", () => {
    expect(sniffImageType(JPEG)).toBe("image/jpeg");
    expect(sniffImageType(PNG)).toBe("image/png");
    expect(sniffImageType(WEBP)).toBe("image/webp");
    expect(sniffImageType(HTML)).toBeNull();
    expect(sniffImageType(new Uint8Array())).toBeNull();
  });

  it("rejects non-images, empty files and files over 10 MB", async () => {
    await expect(savePhoto(db, bucket, { eventId: "ev", uploaderId: "org", full: HTML })).rejects.toMatchObject({ code: "not_an_image" });
    await expect(savePhoto(db, bucket, { eventId: "ev", uploaderId: "org", full: new Uint8Array() })).rejects.toMatchObject({ code: "empty" });
    const big = new Uint8Array(MAX_PHOTO_BYTES + 1);
    big.set(JPEG);
    await expect(savePhoto(db, bucket, { eventId: "ev", uploaderId: "org", full: big })).rejects.toMatchObject({ code: "too_large" });
    await expect(savePhoto(db, bucket, { eventId: "ev", uploaderId: "org", full: JPEG, thumb: HTML })).rejects.toMatchObject({ code: "not_an_image" });
  });

  it("stores the photo and thumbnail in R2 with the sniffed content type", async () => {
    const p = await savePhoto(db, bucket, { eventId: "ev", uploaderId: "org", full: PNG, thumb: JPEG, width: 4000, height: 3000 });
    expect(p.key).toMatch(/^events\/ev\/[0-9a-f-]+\.png$/);
    const obj = await bucket.get(p.key);
    expect(obj?.httpMetadata?.contentType).toBe("image/png");
    expect((await bucket.get(p.thumbKey!))?.httpMetadata?.contentType).toBe("image/jpeg");
    const row = await db.prepare("SELECT width, height, size_bytes, content_type FROM photos WHERE id = ?").bind(p.id).first();
    expect(row).toEqual({ width: 4000, height: 3000, size_bytes: PNG.byteLength, content_type: "image/png" });
  });
});

describe("who can see and tag", { timeout: 30_000 }, () => {
  it("organizer and admin manage; registered attendees view and tag; others see nothing", async () => {
    expect(await photoAccess(db, who("org", "organizer"), "ev")).toEqual({ view: true, manage: true, tag: false });
    expect(await photoAccess(db, who("admin", "admin"), "ev")).toEqual({ view: true, manage: true, tag: false });
    expect(await photoAccess(db, who("org2", "organizer"), "ev")).toEqual({ view: false, manage: false, tag: false });
    expect(await photoAccess(db, who("att"), "ev")).toEqual({ view: true, manage: false, tag: true });
    expect(await photoAccess(db, who("wait"), "ev")).toEqual({ view: false, manage: false, tag: false });
    expect(await photoAccess(db, who("out"), "ev")).toEqual({ view: false, manage: false, tag: false });
    expect(await photoAccess(db, null, "ev")).toEqual({ view: false, manage: false, tag: false });
  });

  it("tags on and off; outsiders get 'not found', and nobody else sees my tags", async () => {
    const p = await savePhoto(db, bucket, { eventId: "ev", uploaderId: "org", full: JPEG });
    await setTag(db, p.id, who("att"), true);
    await setTag(db, p.id, who("att"), true); // twice is fine
    expect((await eventPhotos(db, "ev", "att")).find((x) => x.id === p.id)?.mine).toBe(1);
    expect((await eventPhotos(db, "ev", "org")).find((x) => x.id === p.id)?.mine).toBe(0);
    expect((await myTaggedPhotos(db, "att")).map((x) => x.id)).toContain(p.id);
    expect(await myGalleries(db, "att")).toEqual([expect.objectContaining({ slug: "fest", mine: 1 })]);

    await expect(setTag(db, p.id, who("out"), true)).rejects.toMatchObject({ status: 404 });
    await expect(setTag(db, p.id, who("wait"), true)).rejects.toMatchObject({ status: 404 });
    await expect(setTag(db, p.id, who("org", "organizer"), true)).rejects.toMatchObject({ code: "not_attendee" });

    await setTag(db, p.id, who("att"), false);
    expect((await myTaggedPhotos(db, "att")).map((x) => x.id)).not.toContain(p.id);
  });

  it("if I cancel my registration, my tagged photos from that event leave my vault", async () => {
    const p = await savePhoto(db, bucket, { eventId: "ev", uploaderId: "org", full: JPEG });
    await setTag(db, p.id, who("att"), true);
    await db.prepare("UPDATE registrations SET status = 'cancelled' WHERE id = 'r1'").run();
    expect(await myTaggedPhotos(db, "att")).toHaveLength(0);
    await db.prepare("UPDATE registrations SET status = 'registered' WHERE id = 'r1'").run();
  });

  it("deleting removes the files, the row and its tags", async () => {
    const p = await savePhoto(db, bucket, { eventId: "ev", uploaderId: "org", full: JPEG, thumb: JPEG });
    await setTag(db, p.id, who("att"), true);
    await deletePhoto(db, bucket, p.id, "org");
    expect(await bucket.get(p.key)).toBeNull();
    expect(await bucket.get(p.thumbKey!)).toBeNull();
    expect(await db.prepare("SELECT COUNT(*) AS n FROM photo_tags WHERE photo_id = ?").bind(p.id).first("n")).toBe(0);
    await expect(deletePhoto(db, bucket, p.id, "org")).rejects.toMatchObject({ code: "not_found" });
    const audit = await db.prepare("SELECT action FROM audit_log WHERE target_id = ? ORDER BY created_at").bind(p.id).all<{ action: string }>();
    expect(audit.results?.map((a) => a.action)).toEqual(["photo_upload", "photo_delete"]);
  });
});
