/** "Host an Event" modal: the rules POST /api/events/create enforces before touching the database. */
import { describe, expect, it } from "vitest";
import { hostEventSchema, UNLIMITED_CAPACITY } from "../src/lib/validation";
import { parseDriveLink } from "../src/lib/googleDrive";

const base = {
  title: "HackFest 2026",
  category: "TECH",
  date: "2026-12-12",
  time: "18:30",
  eventType: "in_person",
  location: "Seminar Hall 2",
} as const;

const firstError = (r: ReturnType<typeof hostEventSchema.safeParse>) => (r.success ? null : r.error.issues[0]);

describe("host event form rules", () => {
  it("accepts a free in-person event with defaults (2 h, unlimited seats)", () => {
    const r = hostEventSchema.safeParse(base);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.isFree).toBe(true);
      expect(r.data.durationMinutes).toBe(120);
      expect(r.data.capacity).toBeNull();
    }
    expect(UNLIMITED_CAPACITY).toBe(100_000);
  });

  it("needs a real https meeting link for virtual events", () => {
    expect(firstError(hostEventSchema.safeParse({ ...base, eventType: "virtual", location: "Google Meet" }))?.path).toEqual(["location"]);
    expect(firstError(hostEventSchema.safeParse({ ...base, eventType: "virtual", location: "http://meet.google.com/abc" }))?.path).toEqual(["location"]);
    expect(hostEventSchema.safeParse({ ...base, eventType: "virtual", location: "https://meet.google.com/abc-defg-hij" }).success).toBe(true);
  });

  it("paid passes need a price and a valid UPI ID", () => {
    const noPrice = hostEventSchema.safeParse({ ...base, isFree: false, upiId: "club@okaxis" });
    expect(firstError(noPrice)?.path).toEqual(["ticketPrice"]);
    const noUpi = hostEventSchema.safeParse({ ...base, isFree: false, ticketPrice: 199 });
    expect(firstError(noUpi)?.path).toEqual(["upiId"]);
    const badUpi = hostEventSchema.safeParse({ ...base, isFree: false, ticketPrice: 199, upiId: "not-a-upi" });
    expect(firstError(badUpi)?.path).toEqual(["upiId"]);
    const ok = hostEventSchema.safeParse({ ...base, isFree: false, ticketPrice: 199, upiId: "  Club.Lead@OKAXIS " });
    expect(ok.success && ok.data.upiId).toBe("club.lead@okaxis");
  });

  it("rejects unknown fields and bad times", () => {
    expect(hostEventSchema.safeParse({ ...base, organizer_id: "someone-else" }).success).toBe(false);
    expect(hostEventSchema.safeParse({ ...base, time: "25:00" }).success).toBe(false);
    expect(hostEventSchema.safeParse({ ...base, capacity: 0 }).success).toBe(false);
  });

  it("banner must be an https link", () => {
    expect(hostEventSchema.safeParse({ ...base, bannerUrl: "javascript:alert(1)" }).success).toBe(false);
    expect(hostEventSchema.safeParse({ ...base, bannerUrl: "https://example.com/poster.jpg" }).success).toBe(true);
  });

  it("the Drive field accepts folder links only (checked on the server)", () => {
    expect(parseDriveLink("https://drive.google.com/drive/folders/1AbCdEfGhIjKlMnOpQrStUvWxYz012345")).toMatchObject({ ok: true, kind: "folder" });
    expect(parseDriveLink("https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUvWxYz012345/view")).toMatchObject({ ok: true, kind: "file" });
    expect(parseDriveLink("https://dropbox.com/folders/x")).toMatchObject({ ok: false });
  });
});
