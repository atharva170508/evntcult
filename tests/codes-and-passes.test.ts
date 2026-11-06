import { describe, it, expect } from "vitest";
import {
  ACCESS_CODE_ALPHABET,
  base32,
  extractPassToken,
  isWellFormedAccessCode,
  isWellFormedPassToken,
  newAccessCode,
  newPassToken,
  normalizeAccessCode,
  passCode,
  passQrPayload,
} from "@/lib/tokens";
import { createSessionValue, readSessionValue } from "@/lib/session";
import { istToUtcIso, parseUtc } from "@/lib/time";
import { formatINR, upiUri } from "@/lib/money";

describe("access codes", () => {
  it("are 7 characters with no look-alikes", () => {
    for (let i = 0; i < 500; i++) {
      const c = newAccessCode();
      expect(c).toHaveLength(7);
      expect(isWellFormedAccessCode(c)).toBe(true);
      expect(c).not.toMatch(/[01IOLSZB258]/);
    }
    expect(new Set(ACCESS_CODE_ALPHABET).size).toBe(ACCESS_CODE_ALPHABET.length);
  });
  it("normalise what people type", () => {
    expect(normalizeAccessCode("  ack-3 pq7 ")).toBe("ACK3PQ7");
  });
});

describe("pass tokens", () => {
  it("carry 128 bits of randomness as 26 base32 chars, all unique", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 2000; i++) {
      const t = newPassToken();
      expect(isWellFormedPassToken(t)).toBe(true);
      seen.add(t);
    }
    expect(seen.size).toBe(2000);
    expect(base32(new Uint8Array(16))).toHaveLength(26); // 128 bits → ceil(128/5) = 26
  });
  it("QR payload round-trips to the token and means nothing by itself", () => {
    const t = newPassToken();
    expect(passQrPayload(t)).toBe(`evntcult://p/${t}`);
    expect(extractPassToken(passQrPayload(t))).toBe(t);
    expect(extractPassToken(t.toLowerCase())).toBe(t);
  });
  it("display code is decorative and readable", () => {
    expect(passCode("valorant", 42)).toBe("EC-VALO-0042");
  });
});

describe("sessions", () => {
  process.env.SESSION_SECRET = "test-secret-that-is-at-least-32-characters-long";
  it("accepts its own cookie and rejects tampering or expiry", async () => {
    const v = await createSessionValue("user-1");
    expect(await readSessionValue(v)).toBe("user-1");
    expect(await readSessionValue(v.slice(0, -1) + (v.endsWith("A") ? "B" : "A"))).toBeNull();
    expect(await readSessionValue(v, Date.now() + 15 * 86_400_000)).toBeNull();
    expect(await readSessionValue("garbage")).toBeNull();
  });
});

describe("time", () => {
  it("stores UTC and converts IST input", () => {
    expect(istToUtcIso("2026-11-14", "10:00")).toBe("2026-11-14T04:30:00.000Z");
    expect(() => parseUtc("2026-11-14 10:00")).toThrow();
    expect(parseUtc("2026-11-14T04:30:00.000Z").getTime()).toBe(Date.UTC(2026, 10, 14, 4, 30));
  });
});

describe("money", () => {
  it("is integer paise formatted as INR", () => {
    expect(formatINR(0)).toBe("Free");
    expect(formatINR(29900)).toContain("299");
    expect(upiUri({ vpa: "club@okaxis", payeeName: "Club", amountPaise: 10050, note: "Pass" })).toContain("am=100.50");
  });
});

import { normalizeIndianMobile, formatPhone } from "../src/lib/phone";
describe("phone numbers", () => {
  it("normalises common Indian formats to +91", () => {
    for (const v of ["9876543210", "98765 43210", "+91 98765-43210", "919876543210", "09876543210"]) expect(normalizeIndianMobile(v)).toBe("+919876543210");
  });
  it("rejects landlines, short and foreign numbers", () => {
    for (const v of ["1234567890", "98765", "+1 415 555 0100", "abcdefghij"]) expect(normalizeIndianMobile(v)).toBeNull();
  });
  it("formats for display", () => expect(formatPhone("+919876543210")).toBe("+91 98765 43210"));
});
