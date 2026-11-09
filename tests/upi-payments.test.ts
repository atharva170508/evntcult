/** UPI payments: student submits a transaction ID, organizer confirms or rejects it. */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { testDatabase } from "./helpers/d1";
import { attendeesCsv, claimUpiPayment, listAttendees, rejectUpiClaim, setPayment } from "@/lib/data/organizer-actions";
import { cancel, register, type EventForRegistration } from "@/lib/data/registrations";
import { upiClaimSchema } from "@/lib/validation";

let db: D1Database;
let dispose: () => Promise<void>;
const now = new Date("2026-11-20T06:30:00.000Z");
const at = now.toISOString();
const event: EventForRegistration = { id: "ev1", slug: "neon", capacity: 10, status: "published", starts_at: "2026-11-21T14:00:00.000Z", ends_at: "2026-11-21T18:00:00.000Z" };
const regs: Record<string, string> = {};
const row = (id: string) => db.prepare("SELECT * FROM registrations WHERE id = ?").bind(id).first<Record<string, unknown>>();
let n = 0;
const utr = () => String(100000000000 + ++n);

beforeAll(async () => {
  ({ db, dispose } = await testDatabase());
  await db.batch(
    ["org", "a", "b", "c", "d", "e"].map((id) => db.prepare("INSERT INTO users (id, email, name, role, created_at) VALUES (?, ?, ?, ?, ?)").bind(id, `${id}@college.edu`, id, id === "org" ? "organizer" : "attendee", at)),
  );
  await db
    .prepare(
      `INSERT INTO events (id, slug, title, category, venue, starts_at, ends_at, capacity, price_paise, status, organizer_id, created_at, organizer_upi_id)
       VALUES ('ev1', 'neon', 'Neon', 'PARTY', 'Hall', ?, ?, 10, 10000, 'published', 'org', ?, 'club@okaxis')`,
    )
    .bind(event.starts_at, event.ends_at, at)
    .run();
  for (const u of ["a", "b", "c", "d", "e"]) {
    const r = await register(db, event, u, { now });
    if (r.kind === "full") throw new Error("full");
    regs[u] = r.registration.id;
  }
}, 60_000);
afterAll(() => dispose());

describe("UPI claims", () => {
  it("a claim does not mark the pass paid", async () => {
    await claimUpiPayment(db, regs.a, "a", utr(), now);
    expect(await row(regs.a)).toMatchObject({ payment_status: "unpaid", upi_utr: String(100000000000 + n) });
  });

  it("one transaction ID can't back two passes", async () => {
    const id = utr();
    await claimUpiPayment(db, regs.b, "b", id, now);
    await expect(claimUpiPayment(db, regs.c, "c", id, now)).rejects.toMatchObject({ status: 409, code: "utr_used" });
  });

  it("nobody can claim on someone else's registration", async () => {
    await expect(claimUpiPayment(db, regs.d, "a", utr(), now)).rejects.toMatchObject({ status: 404 });
  });

  it("Received marks paid and keeps the ID as the reference", async () => {
    const id = (await row(regs.a))!.upi_utr as string;
    await setPayment(db, regs.a, "org", { status: "paid", method: "upi" }, now);
    expect(await row(regs.a)).toMatchObject({ payment_status: "paid", payment_method: "upi", payment_ref: id });
    await expect(claimUpiPayment(db, regs.a, "a", utr(), now)).rejects.toMatchObject({ code: "already_paid" });
  });

  it("Not received frees the ID and lets the student try again", async () => {
    const id = (await row(regs.b))!.upi_utr as string;
    await rejectUpiClaim(db, regs.b, "org", now);
    const r = await row(regs.b);
    expect(r).toMatchObject({ payment_status: "unpaid", upi_utr: null });
    expect(r!.upi_rejected_at).toBeTruthy();
    await claimUpiPayment(db, regs.c, "c", id, now);
    await claimUpiPayment(db, regs.b, "b", utr(), now);
    expect((await row(regs.b))!.upi_rejected_at).toBeNull();
  });

  it("claims come first in the guest list and show as To verify in the CSV", async () => {
    const list = await listAttendees(db, "ev1");
    const firstUnclaimed = list.findIndex((a) => a.payment_status === "unpaid" && !a.upi_utr);
    const lastClaimed = list.map((a) => a.payment_status === "unpaid" && !!a.upi_utr).lastIndexOf(true);
    expect(lastClaimed).toBeLessThan(firstUnclaimed);
    expect(attendeesCsv(list, 10000)).toContain("To verify");
  });

  it("cancelling and registering again starts clean", async () => {
    await claimUpiPayment(db, regs.e, "e", utr(), now);
    await cancel(db, regs.e, "e", now);
    await register(db, event, "e", { now });
    expect(await row(regs.e)).toMatchObject({ status: "registered", upi_utr: null });
  });

  it("the form only accepts 12 digits, spaces allowed", () => {
    expect(upiClaimSchema.parse({ utr: "1234 5678 9012" }).utr).toBe("123456789012");
    expect(upiClaimSchema.safeParse({ utr: "12345" }).success).toBe(false);
    expect(upiClaimSchema.safeParse({ utr: "abcd56789012" }).success).toBe(false);
  });
});
