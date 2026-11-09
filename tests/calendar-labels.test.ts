/** Labels on the organizer calendar. */
import { describe, expect, it } from "vitest";
import { isLiveNow, isSoldOut, seatsLabel, spanDays, spanRange } from "@/lib/organizer/shared";

const span = (a: string, b: string) => ({ starts_at: a, ends_at: b });

describe("calendar labels", () => {
  it("no limit reads Unlimited, never 0 or blank", () => {
    expect(seatsLabel({ capacity: null, taken: 12 })).toBe("Unlimited");
    expect(seatsLabel({ capacity: null, taken: 0 })).toBe("Unlimited");
    expect(seatsLabel({ capacity: 200, taken: 184 })).toBe("184 / 200");
    expect(isSoldOut({ capacity: null, taken: 9999 })).toBe(false);
    expect(isSoldOut({ capacity: 5, taken: 5 })).toBe(true);
  });

  it("counts days and writes the range in IST", () => {
    const fest = span("2026-11-20T04:30:00.000Z", "2026-11-22T16:00:00.000Z");
    expect(spanDays(fest)).toBe(3);
    expect(spanRange(fest)).toBe("NOV 20-22");
  });

  it("broken on purpose: crossing a month, and a UTC date that is the next day in IST", () => {
    expect(spanRange(span("2026-11-29T20:00:00.000Z", "2026-12-02T10:00:00.000Z"))).toBe("NOV 30-DEC 2");
    expect(spanDays(span("2026-11-29T20:00:00.000Z", "2026-12-02T10:00:00.000Z"))).toBe(3);
  });

  it("only a published event in progress is live", () => {
    const e = { status: "published", starts_at: "2026-11-20T10:00:00.000Z", ends_at: "2026-11-20T12:00:00.000Z" };
    const during = Date.parse("2026-11-20T11:00:00.000Z");
    expect(isLiveNow(e, during)).toBe(true);
    expect(isLiveNow({ ...e, status: "draft" }, during)).toBe(false);
    expect(isLiveNow(e, Date.parse(e.ends_at))).toBe(false);
  });
});
