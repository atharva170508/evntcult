/** M6: 6-digit login codes — hash-only storage, 10-minute expiry, 5 tries, rate limits (real local D1). */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { testDatabase } from "./helpers/d1";
import { CODE_TTL_MS, generateCode, hashCode, issueCode, LIMITS, LoginCodeError, MAX_TRIES, pendingCode, purgeOldCodes, verifyCode } from "@/lib/data/login-codes";
import { emailMode } from "@/lib/email";

let db: D1Database;
let dispose: () => Promise<void>;
const secret = "test-secret";
const T0 = new Date("2026-11-20T06:30:00.000Z");
const later = (ms: number) => new Date(T0.getTime() + ms);

beforeAll(async () => {
  ({ db, dispose } = await testDatabase());
});
afterAll(() => dispose());

async function expectErr(p: Promise<unknown>, code: string) {
  await expect(p).rejects.toBeInstanceOf(LoginCodeError);
  await p.catch((e: LoginCodeError) => expect(e.code).toBe(code));
}

describe("generateCode", () => {
  it("is always 6 digits", () => {
    for (let i = 0; i < 500; i++) expect(generateCode()).toMatch(/^\d{6}$/);
  });
});

describe("issue + verify", () => {
  it("stores only a hash, and the right code logs in exactly once", async () => {
    const { code } = await issueCode(db, { email: "a@kkw.edu", ip: "1.1.1.1", secret, now: T0 });
    const rows = await db.prepare("SELECT * FROM login_codes WHERE email = 'a@kkw.edu'").all<Record<string, unknown>>();
    expect(rows.results).toHaveLength(1);
    expect(JSON.stringify(rows.results[0])).not.toContain(code);
    expect(rows.results[0].code_hash).toBe(await hashCode(secret, "a@kkw.edu", code));

    await verifyCode(db, { email: "a@kkw.edu", code, secret, now: later(60_000) });
    await expectErr(verifyCode(db, { email: "a@kkw.edu", code, secret, now: later(61_000) }), "no_code");
  });

  it("expires after 10 minutes", async () => {
    const { code } = await issueCode(db, { email: "b@kkw.edu", ip: null, secret, now: T0 });
    await expectErr(verifyCode(db, { email: "b@kkw.edu", code, secret, now: later(CODE_TTL_MS + 1) }), "code_expired");
  });

  it("allows at most 5 tries, then even the right code is refused", async () => {
    const { code } = await issueCode(db, { email: "c@kkw.edu", ip: null, secret, now: T0 });
    const wrong = code === "000000" ? "111111" : "000000";
    for (let i = 1; i < MAX_TRIES; i++) {
      const err = await verifyCode(db, { email: "c@kkw.edu", code: wrong, secret, now: later(1000) }).catch((e: LoginCodeError) => e);
      expect((err as LoginCodeError).code).toBe("invalid_code");
      expect((err as LoginCodeError).triesLeft).toBe(MAX_TRIES - i);
    }
    await expectErr(verifyCode(db, { email: "c@kkw.edu", code: wrong, secret, now: later(1000) }), "too_many_tries");
    await expectErr(verifyCode(db, { email: "c@kkw.edu", code, secret, now: later(1000) }), "too_many_tries");
    expect((await pendingCode(db, "c@kkw.edu", later(1000)))?.locked).toBe(true);
  });

  it("parallel guesses can't get more than 5 tries between them", async () => {
    const { code } = await issueCode(db, { email: "p@kkw.edu", ip: null, secret, now: T0 });
    const wrong = code === "000000" ? "111111" : "000000";
    const results = await Promise.allSettled(Array.from({ length: 12 }, () => verifyCode(db, { email: "p@kkw.edu", code: wrong, secret, now: later(1000) })));
    const row = await db.prepare("SELECT attempts FROM login_codes WHERE email = 'p@kkw.edu'").first<{ attempts: number }>();
    expect(row?.attempts).toBe(MAX_TRIES);
    expect(results.every((r) => r.status === "rejected")).toBe(true);
  });

  it("a new code replaces the old one", async () => {
    const first = await issueCode(db, { email: "d@kkw.edu", ip: null, secret, now: T0 });
    const second = await issueCode(db, { email: "d@kkw.edu", ip: null, secret, now: later(LIMITS.resendGapMs + 1) });
    if (first.code !== second.code) {
      await expectErr(verifyCode(db, { email: "d@kkw.edu", code: first.code, secret, now: later(40_000) }), "invalid_code");
    }
    await verifyCode(db, { email: "d@kkw.edu", code: second.code, secret, now: later(40_000) });
  });

  it("a code for one email doesn't work for another", async () => {
    const { code } = await issueCode(db, { email: "e@kkw.edu", ip: null, secret, now: T0 });
    await issueCode(db, { email: "f@kkw.edu", ip: null, secret, now: T0 });
    const err = await verifyCode(db, { email: "f@kkw.edu", code, secret, now: later(1000) }).catch((e) => e);
    // Could only pass if both random codes happen to match (1 in a million).
    expect(err === undefined || err.code === "invalid_code").toBe(true);
  });
});

describe("rate limits", () => {
  it("one code per email every 30 seconds", async () => {
    await issueCode(db, { email: "r1@kkw.edu", ip: null, secret, now: T0 });
    await expectErr(issueCode(db, { email: "r1@kkw.edu", ip: null, secret, now: later(10_000) }), "rate_limited");
    await issueCode(db, { email: "r1@kkw.edu", ip: null, secret, now: later(LIMITS.resendGapMs + 1) });
  });

  it("at most 5 codes per email per hour", async () => {
    for (let i = 0; i < LIMITS.perEmailPerHour; i++) await issueCode(db, { email: "r2@kkw.edu", ip: null, secret, now: later(i * 60_000) });
    await expectErr(issueCode(db, { email: "r2@kkw.edu", ip: null, secret, now: later(10 * 60_000) }), "rate_limited");
    await issueCode(db, { email: "r2@kkw.edu", ip: null, secret, now: later(70 * 60_000) });
  });

  it("at most 20 codes per IP per hour, across different emails", async () => {
    for (let i = 0; i < LIMITS.perIpPerHour; i++) await issueCode(db, { email: `ip${i}@kkw.edu`, ip: "9.9.9.9", secret, now: T0 });
    await expectErr(issueCode(db, { email: "ipx@kkw.edu", ip: "9.9.9.9", secret, now: later(1000) }), "rate_limited");
    await issueCode(db, { email: "ipx@kkw.edu", ip: "8.8.8.8", secret, now: later(1000) });
  });

  it("the cron clears rows older than a day", async () => {
    await purgeOldCodes(db, later(2 * 86_400_000));
    const n = await db.prepare("SELECT COUNT(*) AS n FROM login_codes").first<{ n: number }>();
    expect(n?.n).toBe(0);
  });
});

describe("emailMode", () => {
  it("is off without a key, log for local testing, brevo with key + sender", () => {
    expect(emailMode({})).toBe("off");
    expect(emailMode({ BREVO_API_KEY: "k" })).toBe("off");
    expect(emailMode({ EMAIL_PROVIDER: "log" })).toBe("log");
    expect(emailMode({ BREVO_API_KEY: "k", EMAIL_FROM: "x@gmail.com" })).toBe("brevo");
  });
});
