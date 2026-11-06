import { describe, it, expect } from "vitest";
import {
  generateEventCode,
  normalizeEventCode,
  isWellFormedEventCode,
  checkCodeUsable,
  CODE_ALPHABET,
} from "@/lib/event-code";
import { createPassToken, verifyPassToken, passSerial } from "@/lib/pass";
import { upiUri, formatINR } from "@/lib/money";

describe("event codes", () => {
  it("generates well-formed 7-char codes without look-alike characters", () => {
    for (let i = 0; i < 500; i++) {
      const c = generateEventCode();
      expect(c).toHaveLength(7);
      expect(isWellFormedEventCode(c)).toBe(true);
      expect(c).not.toMatch(/[01IOLSZB258]/);
    }
    expect(new Set(CODE_ALPHABET).size).toBe(CODE_ALPHABET.length);
  });

  it("normalises user input", () => {
    expect(normalizeEventCode("  ack-3 pq7 ")).toBe("ACK3PQ7");
  });

  it("checks usability", () => {
    const base = { active: true, expiresAt: null, maxUses: null, uses: 0 };
    expect(checkCodeUsable(base).ok).toBe(true);
    expect(checkCodeUsable({ ...base, active: false })).toEqual({ ok: false, reason: "inactive" });
    expect(checkCodeUsable({ ...base, expiresAt: new Date(Date.now() - 1) })).toEqual({ ok: false, reason: "expired" });
    expect(checkCodeUsable({ ...base, maxUses: 5, uses: 5 })).toEqual({ ok: false, reason: "exhausted" });
  });
});

describe("pass tokens", () => {
  it("round-trips signed claims", () => {
    const tok = createPassToken({ registrationId: "reg_1", eventId: "evt_1" });
    expect(verifyPassToken(tok)).toEqual({ registrationId: "reg_1", eventId: "evt_1" });
  });

  it("rejects tampered tokens", () => {
    const tok = createPassToken({ registrationId: "reg_1", eventId: "evt_1" });
    const [p, payload, sig] = tok.split(".");
    const forged = Buffer.from(JSON.stringify({ r: "reg_2", e: "evt_1", n: "x" })).toString("base64url");
    expect(verifyPassToken(`${p}.${forged}.${sig}`)).toBeNull();
    expect(verifyPassToken(`${p}.${payload}.${sig.slice(0, -2)}xx`)).toBeNull();
    expect(verifyPassToken("garbage")).toBeNull();
  });

  it("builds readable serials", () => {
    expect(passSerial("robowars-2026", 42)).toBe("EC-ROBO-0042");
  });
});

describe("money", () => {
  it("formats paise as INR", () => {
    expect(formatINR(0)).toBe("Free");
    expect(formatINR(29900)).toBe("₹299");
  });
  it("builds an NPCI UPI URI", () => {
    const uri = upiUri({ vpa: "club@okaxis", payeeName: "Robotics Club", amountPaise: 29900, note: "Neon Night" });
    expect(uri).toBe("upi://pay?pa=club%40okaxis&pn=Robotics+Club&am=299.00&cu=INR&tn=Neon+Night");
  });
});
