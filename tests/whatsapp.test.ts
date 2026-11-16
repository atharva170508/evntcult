/** The WhatsApp pipeline, on a real local database, with Meta replaced by a fake. */
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { testDatabase } from "./helpers/d1";
import { enqueueOne, enqueueSchedule, flush, inQuietHours, nextMorning, onCancelled, onMaterialChange, queueTest, replayDryRun, sendTemplate, setOptFromWhatsApp, waPanel } from "@/lib/whatsapp";

let db: D1Database;
let dispose: () => Promise<void>;
// 14:00 IST, outside quiet hours.
const T0 = new Date("2026-12-01T08:30:00.000Z");
const START = "2026-12-05T14:00:00.000Z";
const END = "2026-12-05T17:00:00.000Z";
const after = (min: number, from = T0) => new Date(from.getTime() + min * 60_000);
const DRY = {};
const LIVE = { WA_TOKEN: "secret-token-value", WA_PHONE_NUMBER_ID: "123" };

const rows = (ev: string, template?: string) =>
  db.prepare(`SELECT user_id, template, status, error, scheduled_for, provider_id, dedupe_key FROM notifications WHERE event_id = ? ${template ? "AND template = ?" : ""} ORDER BY scheduled_for, user_id`).bind(...(template ? [ev, template] : [ev])).all<{ user_id: string; template: string; status: string; error: string | null; scheduled_for: string; provider_id: string | null; dedupe_key: string }>().then((r) => r.results);

let seq = 0;
async function event(opts: { price?: number; start?: string; status?: string } = {}) {
  const id = `ev${++seq}`;
  const start = opts.start ?? START;
  await db.prepare("INSERT INTO events (id, slug, title, category, venue, starts_at, ends_at, capacity, price_paise, status, organizer_id, created_at) VALUES (?, ?, 'Night', 'PARTY', 'Hall A', ?, ?, 50, ?, ?, 'org', ?)").bind(id, id, start, new Date(Date.parse(start) + 3 * 3_600_000).toISOString(), opts.price ?? 0, opts.status ?? "published", T0.toISOString()).run();
  return id;
}
const reg = (ev: string, user: string, paid = "unpaid") => db.prepare("INSERT INTO registrations (id, event_id, user_id, status, pass_code, pass_token, payment_status, created_at) VALUES (?, ?, ?, 'registered', ?, ?, ?, ?)").bind(`${ev}${user}`, ev, user, `EC-${ev}${user}`, `tok${ev}${user}`, paid, T0.toISOString()).run();

beforeAll(async () => {
  ({ db, dispose } = await testDatabase());
  const users: [string, string | null, number, string | null][] = [["org", "+919800000000", 1, null], ["in", "+919800000001", 1, null], ["no", "+919800000002", 0, null], ["nophone", null, 1, null], ["x", "+919800000003", 1, null]];
  await db.batch(users.map(([id, phone, opt, out]) => db.prepare("INSERT INTO users (id, email, name, role, created_at, phone, whatsapp_opt_in, wa_opt_out_at) VALUES (?, ?, ?, 'attendee', ?, ?, ?, ?)").bind(id, `${id}@x.co`, id, T0.toISOString(), phone, opt, out)));
}, 60_000);
afterAll(() => dispose());
beforeEach(() => db.prepare("UPDATE notifications SET status = 'skipped' WHERE status = 'queued'").run());
afterEach(() => vi.unstubAllGlobals());

function fakeMeta() {
  const calls: { url: string; headers: Record<string, string>; body: { to: string; template: { name: string; components: { parameters: { text: string }[] }[] } } }[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: { headers: Record<string, string>; body: string }) => {
      calls.push({ url, headers: init.headers, body: JSON.parse(init.body) });
      return new Response(JSON.stringify({ messages: [{ id: `wamid.${calls.length}` }] }), { status: 200 });
    }),
  );
  return calls;
}
const params = (c: ReturnType<typeof fakeMeta>[number]) => c.body.template.components[0].parameters.map((p) => p.text);

describe("schedule", () => {
  it("queues reminders at the right times, and running it again adds nothing", async () => {
    const ev = await event();
    await reg(ev, "in");
    await enqueueSchedule(db, ev, T0);
    await enqueueSchedule(db, ev, after(5));
    const r = await rows(ev);
    expect(r.map((n) => [n.template, n.scheduled_for]).sort()).toEqual([["event_reminder", "2026-12-04T14:00:00.000Z"], ["event_soon", "2026-12-05T12:00:00.000Z"]]);
  });

  it("broken on purpose: a free event never asks anyone to pay, a paid event does", async () => {
    const free = await event();
    await reg(free, "in");
    await enqueueSchedule(db, free, T0);
    expect((await rows(free)).some((n) => n.template === "payment_pending")).toBe(false);
    const paid = await event({ price: 10000 });
    await reg(paid, "in");
    await enqueueSchedule(db, paid, T0);
    expect((await rows(paid)).map((n) => n.template)).toEqual(["payment_pending"]);
  });

  it("broken on purpose: registering in the last two hours gets one message, not two", async () => {
    const start = after(60).toISOString();
    const ev = await event({ start });
    await reg(ev, "in");
    await enqueueSchedule(db, ev, T0);
    expect((await rows(ev)).map((n) => n.template)).toEqual(["event_soon"]);
  });
});

describe("sending", () => {
  it("with no token, rows become dry_run and nothing is sent", async () => {
    const calls = fakeMeta();
    const ev = await event();
    await reg(ev, "in");
    await enqueueOne(db, "in", ev, "pass_confirmed", `p:${ev}`, T0);
    expect(await flush(db, DRY, T0)).toMatchObject({ dry: 1, sent: 0 });
    expect((await rows(ev))[0].status).toBe("dry_run");
    expect(calls).toHaveLength(0);
    expect((await waPanel(db, ev, T0)).dryRun).toBe(1);
  });

  it("with a token, the same row is sent and keeps Meta's id; the number loses its plus", async () => {
    const calls = fakeMeta();
    const ev = await event();
    await reg(ev, "in");
    await enqueueOne(db, "in", ev, "pass_confirmed", `p:${ev}`, T0);
    expect(await flush(db, LIVE, T0)).toMatchObject({ sent: 1 });
    expect((await rows(ev))[0]).toMatchObject({ status: "sent", provider_id: "wamid.1" });
    expect(calls[0].body.to).toBe("919800000001");
    expect(params(calls[0])).toEqual(["Night", expect.stringContaining("Dec"), `EC-${ev}in`]);
  });

  it("replaying the cron never sends twice", async () => {
    const calls = fakeMeta();
    const ev = await event();
    await reg(ev, "in");
    await enqueueOne(db, "in", ev, "pass_confirmed", `p:${ev}`, T0);
    await enqueueOne(db, "in", ev, "pass_confirmed", `p:${ev}`, T0);
    await Promise.all([flush(db, LIVE, T0), flush(db, LIVE, T0)]);
    await flush(db, LIVE, T0);
    expect(calls).toHaveLength(1);
  });

  it("no consent or no number is skipped, with the reason", async () => {
    const ev = await event();
    await reg(ev, "no");
    await reg(ev, "nophone");
    await enqueueOne(db, "no", ev, "pass_confirmed", `p:${ev}`, T0);
    await enqueueOne(db, "nophone", ev, "pass_confirmed", `p:${ev}`, T0);
    await flush(db, DRY, T0);
    expect((await rows(ev)).map((n) => [n.status, n.error])).toEqual([["skipped", "not_opted_in"], ["skipped", "no_phone"]]);
  });

  it("at the cap of 5 a message is skipped, except a cancellation", async () => {
    const ev = await event();
    await reg(ev, "in");
    for (let i = 0; i < 5; i++) await enqueueOne(db, "in", ev, "event_update", `u${i}:${ev}`, T0, JSON.stringify({ message: "x" }));
    await flush(db, DRY, T0);
    await enqueueOne(db, "in", ev, "event_update", `u6:${ev}`, T0, JSON.stringify({ message: "x" }));
    await flush(db, DRY, T0);
    expect((await rows(ev)).filter((n) => n.status === "skipped").map((n) => n.error)).toEqual(["cap"]);
    await db.prepare("UPDATE events SET status = 'cancelled' WHERE id = ?").bind(ev).run();
    await onCancelled(db, ev, START, T0);
    await flush(db, DRY, T0);
    expect((await rows(ev, "event_cancelled"))[0].status).toBe("dry_run");
  });

  it("a message due at 02:00 moves to 08:15, and a cancellation doesn't wait", async () => {
    const twoAm = new Date("2026-12-02T20:30:00.000Z"); // 02:00 IST on the 3rd
    expect(inQuietHours(twoAm)).toBe(true);
    expect(inQuietHours(T0)).toBe(false);
    expect(nextMorning(twoAm).toISOString()).toBe("2026-12-03T02:45:00.000Z");
    const elevenPm = new Date("2026-12-02T17:45:00.000Z"); // 23:15 IST on the 2nd
    expect(nextMorning(elevenPm).toISOString()).toBe("2026-12-03T02:45:00.000Z");
    const ev = await event();
    await reg(ev, "in");
    await enqueueOne(db, "in", ev, "pass_confirmed", `p:${ev}`, twoAm);
    await flush(db, DRY, twoAm);
    expect((await rows(ev))[0]).toMatchObject({ status: "queued", scheduled_for: "2026-12-03T02:45:00.000Z" });
  });

  it("a failed send retries, then gives up, and the token never lands in the row", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ error: { code: 131, message: "nope" } }), { status: 400 })));
    const ev = await event();
    await reg(ev, "in");
    await enqueueOne(db, "in", ev, "pass_confirmed", `p:${ev}`, T0);
    await flush(db, LIVE, T0);
    expect((await rows(ev))[0].status).toBe("queued");
    await flush(db, LIVE, after(20));
    await flush(db, LIVE, after(40));
    const [r] = await rows(ev);
    expect(r.status).toBe("failed");
    expect(JSON.stringify(r)).not.toContain(LIVE.WA_TOKEN);
  });

  it("the token only ever goes in the header to Meta", async () => {
    const calls = fakeMeta();
    expect(JSON.stringify(await sendTemplate(LIVE, "+91", "x", []))).not.toContain(LIVE.WA_TOKEN);
    expect(calls[0].url).toContain("graph.facebook.com");
    expect(calls[0].headers.Authorization).toBe(`Bearer ${LIVE.WA_TOKEN}`);
  });
});

describe("event changes", () => {
  it("moving an event replaces the reminders at the new times", async () => {
    const ev = await event();
    await reg(ev, "in");
    await enqueueSchedule(db, ev, T0);
    const moved = "2026-12-10T14:00:00.000Z";
    await db.prepare("UPDATE events SET starts_at = ?, ends_at = ? WHERE id = ?").bind(moved, END.replace("05", "10"), ev).run();
    await onMaterialChange(db, ev, moved, T0);
    expect((await rows(ev, "event_reminder")).map((n) => n.scheduled_for)).toEqual(["2026-12-09T14:00:00.000Z"]);
    expect((await rows(ev, "event_soon")).map((n) => n.scheduled_for)).toEqual(["2026-12-10T12:00:00.000Z"]);
  });

  it("six edits send one update, 5 minutes after the last, with the final venue", async () => {
    const calls = fakeMeta();
    const ev = await event();
    await reg(ev, "in");
    for (let i = 0; i < 6; i++) {
      await db.prepare("UPDATE events SET venue = ? WHERE id = ?").bind(`Hall ${i}`, ev).run();
      await onMaterialChange(db, ev, START, after(i));
    }
    const updates = await rows(ev, "event_updated");
    expect(updates).toHaveLength(1);
    expect(updates[0].scheduled_for).toBe(after(10).toISOString());
    await flush(db, LIVE, after(9));
    expect(calls).toHaveLength(0);
    await flush(db, LIVE, after(10));
    expect(params(calls[0]).join(" ")).toContain("Hall 5");
  });

  it("close to the start, the update goes straight away", async () => {
    const start = after(60).toISOString();
    const ev = await event({ start });
    await reg(ev, "in");
    await onMaterialChange(db, ev, start, T0);
    expect((await rows(ev, "event_updated"))[0].scheduled_for).toBe(T0.toISOString());
  });

  it("broken on purpose: a queued reminder announces today's venue, not the old one", async () => {
    const calls = fakeMeta();
    const ev = await event();
    await reg(ev, "in");
    await enqueueSchedule(db, ev, T0);
    await db.prepare("UPDATE events SET venue = 'Brand New Place' WHERE id = ?").bind(ev).run();
    await flush(db, LIVE, new Date("2026-12-04T14:00:00.000Z"));
    expect(params(calls[0])).toContain("Brand New Place");
  });

  it("someone who paid since being queued isn't nudged, and someone who left gets nothing", async () => {
    const ev = await event({ price: 5000 });
    await reg(ev, "in");
    await reg(ev, "x");
    await enqueueSchedule(db, ev, T0);
    await db.prepare("UPDATE registrations SET payment_status = 'paid' WHERE id = ?").bind(`${ev}in`).run();
    await db.prepare("UPDATE registrations SET status = 'cancelled' WHERE id = ?").bind(`${ev}x`).run();
    await flush(db, DRY, new Date("2026-12-04T14:00:00.000Z"));
    expect((await rows(ev)).map((n) => n.error).sort()).toEqual(["already_paid", "not_registered"]);
  });
});

describe("STOP and START", () => {
  it("STOP stops everything for that number, START resumes", async () => {
    await setOptFromWhatsApp(db, "919800000003", false, T0);
    const ev = await event();
    await reg(ev, "x");
    await enqueueOne(db, "x", ev, "pass_confirmed", `p:${ev}`, T0);
    await flush(db, DRY, T0);
    expect((await rows(ev))[0]).toMatchObject({ status: "skipped", error: "opted_out" });
    await setOptFromWhatsApp(db, "919800000003", true, T0);
    await enqueueOne(db, "x", ev, "pass_confirmed", `again:${ev}`, T0);
    await flush(db, DRY, T0);
    expect((await rows(ev)).map((n) => n.status).sort()).toEqual(["dry_run", "skipped"]);
  });
});

describe("panel and tools", () => {
  it("counts without any message text, and a test can be sent without a pass", async () => {
    const calls = fakeMeta();
    const ev = await event();
    await reg(ev, "in");
    await enqueueSchedule(db, ev, T0);
    const panel = await waPanel(db, ev, T0);
    expect(panel).toMatchObject({ optedIn: 1, queued: 2 });
    expect(panel.next.map((n) => n.template)).toEqual(["event_reminder", "event_soon"]);
    expect(Object.keys(panel.next[0]).sort()).toEqual(["at", "count", "template"]);
    await queueTest(db, "org", ev, T0);
    await flush(db, LIVE, T0);
    expect(params(calls[0])).toContain("TEST");
  });

  it("replay turns dry runs back into queued messages", async () => {
    const ev = await event();
    await reg(ev, "in");
    await enqueueOne(db, "in", ev, "pass_confirmed", `p:${ev}`, T0);
    await flush(db, DRY, T0);
    expect(await replayDryRun(db, T0.toISOString())).toBeGreaterThan(0);
    expect((await rows(ev))[0].status).toBe("queued");
  });
});
