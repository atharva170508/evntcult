/** Terms & Conditions: new accounts must tick the box; acceptance is stored with the version. */
import { describe, expect, it, vi } from "vitest";

// auth-shared is server code; its "server-only" guard has nothing to guard in a test.
vi.mock("server-only", () => ({}));
import { assertSignupDetails } from "@/lib/auth-shared";
import { TERMS_LABEL, TERMS_VERSION } from "@/lib/terms";
import { testDatabase } from "./helpers/d1";

describe("sign-up needs the terms checkbox", () => {
  const ok = { name: "Diya Shah", phone: "+919876543210" };
  it("refuses an account without ticking it", () => {
    expect(() => assertSignupDetails(ok)).toThrow(expect.objectContaining({ status: 400, code: "terms_required" }));
    expect(() => assertSignupDetails({ ...ok, acceptTerms: false })).toThrow(expect.objectContaining({ code: "terms_required" }));
  });
  it("accepts it once ticked", () => {
    expect(() => assertSignupDetails({ ...ok, acceptTerms: true })).not.toThrow();
  });
  it("still asks for name and number first", () => {
    expect(() => assertSignupDetails({ acceptTerms: true })).toThrow(expect.objectContaining({ code: "name_required" }));
  });
  it("uses the exact wording and a dated version", () => {
    expect(TERMS_LABEL).toBe("I have read, understand, and agree to the Terms & Conditions and User Rules");
    expect(TERMS_VERSION).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("existing accounts", { timeout: 30_000 }, () => {
  it("start with no acceptance, so they are asked once", async () => {
    const { db, dispose } = await testDatabase();
    await db.prepare("INSERT INTO users (id, email, name, role, created_at) VALUES ('u', 'u@x.edu', 'U', 'attendee', '2026-11-01T00:00:00Z')").run();
    expect(await db.prepare("SELECT terms_accepted_at, terms_version FROM users WHERE id = 'u'").first()).toEqual({ terms_accepted_at: null, terms_version: null });
    await dispose();
  });
});
