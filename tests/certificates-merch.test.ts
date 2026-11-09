/** Certificates issued from check-ins, and goodies claimed once with the pass. */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { testDatabase } from "./helpers/d1";
import { newPassToken } from "@/lib/tokens";
import { checkIn } from "@/lib/data/checkins";
import { CERT_UNDONE, certificateFor, issueBulk, issueOne, myCertificates, newPublicCode, revokeCertificate, setCertificatesEnabled, undoCheckIn, verifyCertificate } from "@/lib/data/certificates";
import { claimMerch, createMerchItem, deleteMerchItem, listMerch, merchClaimsCsv, merchCollected, passMerch } from "@/lib/data/merch";

let db: D1Database;
let dispose: () => Promise<void>;
const now = new Date("2026-12-20T13:00:00.000Z");
const tokens: Record<string, string> = {};
const token = (u: string) => (tokens[u] ??= newPassToken());
let n = 0;
const scan = (u: string) => checkIn(db, { eventId: "ev", passToken: token(u), clientScanId: `scan-${++n}-000`, now });
const certs = (u: string) => db.prepare("SELECT c.* FROM certificates c WHERE registration_id = ?").bind(`r${u}`).all<{ id: string; public_code: string; revoked_at: string | null; revoked_reason: string | null; kind: string }>().then((r) => r.results);
const claim = (u: string, item: string, id = `claim-${++n}-000`) => claimMerch(db, { token: token(u), itemId: item, clientClaimId: id, now });

beforeAll(async () => {
  ({ db, dispose } = await testDatabase());
  const at = now.toISOString();
  const users = ["org", "a", "b", "c", "d", "e", "f"];
  await db.batch(users.map((u) => db.prepare("INSERT INTO users (id, email, name, role, created_at) VALUES (?, ?, ?, ?, ?)").bind(u, `${u}@x.co`, `Name ${u}`, u === "org" ? "organizer" : "attendee", at)));
  await db.prepare("INSERT INTO events (id, slug, title, category, venue, starts_at, ends_at, capacity, price_paise, status, organizer_id, created_at) VALUES ('ev', 'ev', 'Night', 'PARTY', 'Hall', '2026-12-20T12:00:00.000Z', '2026-12-20T16:00:00.000Z', 50, 0, 'published', 'org', ?)").bind(at).run();
  await db.batch(users.slice(1).map((u, i) => db.prepare("INSERT INTO registrations (id, event_id, user_id, status, pass_code, pass_token, payment_status, created_at) VALUES (?, 'ev', ?, 'registered', ?, ?, 'unpaid', ?)").bind(`r${u}`, u, `EC-EV-000${i}`, token(u), at)));
}, 60_000);
afterAll(() => dispose());

describe("certificates", () => {
  it("nobody who only registered has one", async () => {
    expect(await certs("f")).toEqual([]);
    expect(await myCertificates(db, "f")).toEqual([]);
    await expect(issueOne(db, "rf", "winner", "org", now)).rejects.toMatchObject({ code: "not_checked_in" });
  });

  it("checking in creates exactly one, and scanning twice still creates one", async () => {
    expect((await scan("a")).result).toBe("admitted");
    expect((await scan("a")).result).toBe("already_in");
    expect(await certs("a")).toHaveLength(1);
    expect((await myCertificates(db, "a"))[0]).toMatchObject({ name: "Name a", eventTitle: "Night", kind: "participation" });
  });

  it("the public code has no confusing characters", () => {
    for (let i = 0; i < 200; i++) expect(newPublicCode()).toMatch(/^[2-9A-HJ-NP-Z]{8}$/);
  });

  it("only the holder, organizer or admin can open it", async () => {
    const [c] = await certs("a");
    expect(await certificateFor(db, c.id, { id: "a", role: "attendee" })).not.toBeNull();
    expect(await certificateFor(db, c.id, { id: "org", role: "organizer" })).not.toBeNull();
    expect(await certificateFor(db, c.id, { id: "b", role: "attendee" })).toBeNull();
  });

  it("verifies publicly, in any letter case, and an unknown code is just null", async () => {
    const [c] = await certs("a");
    expect(await verifyCertificate(db, c.public_code.toLowerCase())).toMatchObject({ name: "Name a", eventTitle: "Night", revokedAt: null });
    expect(await verifyCertificate(db, "NOPENOPE")).toBeNull();
  });

  it("undoing the check-in revokes it, it still verifies, and checking in again restores the same code", async () => {
    await scan("b");
    const [before] = await certs("b");
    await undoCheckIn(db, "rb", "org", now);
    const [after] = await certs("b");
    expect(after.revoked_reason).toBe(CERT_UNDONE);
    expect((await verifyCertificate(db, before.public_code))?.revokedAt).toBeTruthy();
    expect(await myCertificates(db, "b")).toEqual([]);
    await scan("b");
    const [back] = await certs("b");
    expect(back).toMatchObject({ public_code: before.public_code, revoked_at: null });
  });

  it("broken on purpose: a certificate the organizer revoked is not revived by a re-scan or bulk issue", async () => {
    await scan("c");
    const [c] = await certs("c");
    await revokeCertificate(db, c.id, "cheated", "org", now);
    await scan("c");
    expect(await issueBulk(db, "ev", "org", now)).toEqual({ issued: 0 });
    expect((await certs("c"))[0].revoked_reason).toBe("cheated");
  });

  it("someone can be participant and winner, but each only once", async () => {
    await issueOne(db, "ra", "winner", "org", now);
    await expect(issueOne(db, "ra", "winner", "org", now)).rejects.toMatchObject({ code: "already_issued" });
    expect((await certs("a")).map((c) => c.kind).sort()).toEqual(["participation", "winner"]);
  });

  it("with issuing switched off nothing is automatic, and bulk catches up", async () => {
    await setCertificatesEnabled(db, "ev", false);
    await scan("d");
    expect(await certs("d")).toEqual([]);
    expect(await issueBulk(db, "ev", "org", now)).toEqual({ issued: 1 });
    expect(await certs("d")).toHaveLength(1);
    await setCertificatesEnabled(db, "ev", true);
  });
});

describe("goodies", () => {
  let tee: string;
  let sticker: string;
  beforeAll(async () => {
    tee = await createMerchItem(db, "ev", { name: "T-shirt", variant: "M", stock: 2 }, now);
    sticker = await createMerchItem(db, "ev", { name: "Sticker", stock: null }, new Date(now.getTime() + 1));
  });
  const stock = async (id: string) => (await listMerch(db, "ev")).find((i) => i.id === id)!;

  it("claiming twice says already claimed and takes one from stock", async () => {
    expect(await claim("a", tee)).toMatchObject({ result: "claimed", left: 1, replay: false });
    expect(await claim("a", tee)).toMatchObject({ result: "already_claimed" });
    expect(await stock(tee)).toMatchObject({ left: 1, claimed: 1 });
  });

  it("an offline claim sent twice counts once", async () => {
    expect(await claim("b", sticker, "offline-claim-1")).toMatchObject({ result: "claimed", replay: false });
    expect(await claim("b", sticker, "offline-claim-1")).toMatchObject({ result: "claimed", replay: true });
    expect(await stock(sticker)).toMatchObject({ left: null, claimed: 1 });
  });

  it("broken on purpose: three people racing for the last item, exactly one gets it", async () => {
    const results = await Promise.all(["c", "d", "e"].map((u) => claim(u, tee)));
    expect(results.filter((r) => r.result === "claimed")).toHaveLength(1);
    expect(await stock(tee)).toMatchObject({ left: 0, claimed: 2 });
  });

  it("no stock says which size is gone and how many were given", async () => {
    const r = await claim("f", tee);
    expect(r).toMatchObject({ result: "sold_out", message: "No M left", claimed: 2 });
  });

  it("the scanner sees what this pass can collect", async () => {
    const lines = await passMerch(db, "ev", token("a"));
    expect(lines.map((l) => l.label)).toEqual(["T-shirt · M", "Sticker"]);
    expect(lines[0].claimedAt).toBeTruthy();
    expect(lines[1].claimedAt).toBeNull();
  });

  it("a stranger's token gets nothing, and an item with claims can't be deleted", async () => {
    expect(await claimMerch(db, { token: "nope", itemId: sticker, clientClaimId: "stranger-claim", now })).toMatchObject({ result: "invalid" });
    await expect(deleteMerchItem(db, "ev", tee)).rejects.toMatchObject({ code: "has_claims" });
  });

  it("totals and the CSV add up", async () => {
    expect(await merchCollected(db, "ev")).toEqual({ collected: 3, passes: 6 });
    expect(await merchClaimsCsv(db, "ev")).toContain("T-shirt");
  });
});
