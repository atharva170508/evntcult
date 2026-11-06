import { describe, it, expect } from "vitest";
import { detectClashes, hasHardClash, overlapMinutes, type ExistingEvent } from "@/lib/clash";

const t = (hhmm: string) => new Date(`2026-11-20T${hhmm}:00+05:30`);

const existing: ExistingEvent[] = [
  { id: "a", title: "RoboWars", venueId: "oat", venueName: "OAT", startsAt: t("18:00"), endsAt: t("21:00"), status: "PUBLISHED", category: "TECH", capacity: 1200, bufferMinutes: 60 },
  { id: "b", title: "Valorant", venueId: "sh2", venueName: "Seminar Hall 2", startsAt: t("10:00"), endsAt: t("14:00"), status: "PUBLISHED", category: "GAMING", capacity: 100, bufferMinutes: 30 },
  { id: "c", title: "Cancelled Thing", venueId: "sh2", venueName: "Seminar Hall 2", startsAt: t("15:00"), endsAt: t("16:00"), status: "CANCELLED", category: "TALK" },
  { id: "d", title: "Draft Thing", venueId: "sh2", venueName: "Seminar Hall 2", startsAt: t("16:00"), endsAt: t("17:00"), status: "DRAFT", category: "TALK" },
];

describe("overlapMinutes", () => {
  it("is zero for back-to-back slots", () => {
    expect(overlapMinutes(t("10:00"), t("11:00"), t("11:00"), t("12:00"))).toBe(0);
  });
  it("measures partial overlap", () => {
    expect(overlapMinutes(t("10:00"), t("11:30"), t("11:00"), t("12:00"))).toBe(30);
  });
});

describe("detectClashes", () => {
  it("flags a hard clash for the same venue and overlapping time", () => {
    const c = detectClashes({ venueId: "oat", startsAt: t("20:00"), endsAt: t("22:00") }, existing);
    expect(hasHardClash(c)).toBe(true);
    expect(c[0]).toMatchObject({ eventId: "a", severity: "hard", overlapMinutes: 60 });
  });

  it("enforces the venue setup/teardown buffer", () => {
    // RoboWars ends 21:00 with a 60 min buffer → 21:30 is too soon.
    const c = detectClashes({ venueId: "oat", startsAt: t("21:30"), endsAt: t("23:00") }, existing);
    expect(hasHardClash(c)).toBe(true);
    expect(c[0].reason).toMatch(/setup\/teardown/);
  });

  it("allows booking after the buffer", () => {
    const c = detectClashes({ venueId: "oat", startsAt: t("22:00"), endsAt: t("23:00") }, existing);
    expect(c).toHaveLength(0);
  });

  it("ignores cancelled and draft events", () => {
    const c = detectClashes({ venueId: "sh2", startsAt: t("15:00"), endsAt: t("17:00") }, existing);
    expect(c).toHaveLength(0);
  });

  it("raises a soft clash for same-category events at other venues", () => {
    const c = detectClashes({ venueId: "lab4", startsAt: t("12:00"), endsAt: t("15:00"), category: "GAMING" }, existing);
    expect(c).toHaveLength(1);
    expect(c[0]).toMatchObject({ severity: "soft", eventId: "b" });
    expect(hasHardClash(c)).toBe(false);
  });

  it("raises a soft clash against big campus-wide events", () => {
    const c = detectClashes({ venueId: "lawn", startsAt: t("19:00"), endsAt: t("20:00"), category: "PARTY" }, existing);
    expect(c[0]).toMatchObject({ severity: "soft", eventId: "a" });
  });

  it("excludes the event being edited", () => {
    const c = detectClashes({ id: "a", venueId: "oat", startsAt: t("18:00"), endsAt: t("21:00") }, existing);
    expect(c).toHaveLength(0);
  });

  it("orders hard clashes before soft", () => {
    const c = detectClashes(
      { venueId: "sh2", startsAt: t("13:00"), endsAt: t("19:00"), category: "TECH", expectedAttendance: 50 },
      existing,
    );
    expect(c.map((x) => x.severity)).toEqual(["hard", "soft"]);
  });

  it("rejects an end time before the start", () => {
    expect(() => detectClashes({ venueId: "oat", startsAt: t("12:00"), endsAt: t("11:00") }, existing)).toThrow(RangeError);
  });
});
