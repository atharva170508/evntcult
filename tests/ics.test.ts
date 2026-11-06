import { describe, expect, it } from "vitest";
import { buildIcs, foldLine, icsDate, icsEscape, icsFileName } from "@/lib/ics";

describe(".ics calendar files", () => {
  const ics = buildIcs({
    uid: "reg1@evntcult",
    title: "Valorant; Campus, Showdown",
    startsAt: "2026-11-20T04:30:00.000Z",
    endsAt: "2026-11-20T10:30:00.000Z",
    location: "Seminar Hall 2",
    description: "Line one\nLine two",
    url: "https://evntcult.caliper.workers.dev/events/valorant",
    now: new Date("2026-11-06T00:00:00.000Z"),
  });

  it("has the right structure with CRLF line endings", () => {
    expect(ics.startsWith("BEGIN:VCALENDAR\r\nVERSION:2.0\r\n")).toBe(true);
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect(ics).toContain("DTSTART:20261120T043000Z\r\n");
    expect(ics).toContain("DTEND:20261120T103000Z\r\n");
    expect(ics).toContain("UID:reg1@evntcult\r\n");
    expect(ics.split("\r\n").every((l) => new TextEncoder().encode(l).length <= 75)).toBe(true);
  });

  it("escapes special characters", () => {
    expect(icsEscape("a;b,c\\d\ne")).toBe("a\;b\\,c\\\\d\\ne");
    expect(ics).toContain("SUMMARY:Valorant\; Campus\\, Showdown");
  });

  it("folds long lines without breaking multi-byte characters", () => {
    const long = "DESCRIPTION:" + "₹".repeat(60);
    const folded = foldLine(long);
    for (const part of folded.split("\r\n")) expect(new TextEncoder().encode(part).length).toBeLessThanOrEqual(75);
    expect(folded.replace(/\r\n /g, "")).toBe(long);
  });

  it("formats dates and file names", () => {
    expect(icsDate("2026-01-02T03:04:05.678Z")).toBe("20260102T030405Z");
    expect(icsFileName("Neon Night: Freshers' Party!")).toBe("neon-night-freshers-party.ics");
  });
});
