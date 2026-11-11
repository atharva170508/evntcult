/**
 * Gate check-in. The single place that admits people.
 *
 * Like registrations.ts, every function takes the D1 database as an argument and has
 * no "server-only" import, so routes, the worker and tests share it.
 *
 * Idempotent two ways (both are UNIQUE in the checkins table):
 *  • registration_id — a pass can only be admitted once ("already in" after that)
 *  • client_scan_id  — the scanner's own id for a scan. When an offline scan is synced
 *    twice (flaky network, retries), the second copy returns the first result.
 */
import { extractPassToken, isWellFormedPassToken, newId } from "@/lib/tokens";
import { issueOnCheckIn } from "@/lib/data/certificates";
import { enqueueCheckedIn } from "@/lib/whatsapp";

export type ScanColor = "green" | "amber" | "red";

export type ScanResult =
  | { result: "admitted"; color: "green"; registrationId: string; name: string; passCode: string; scannedAt: string; replay: boolean }
  | { result: "already_in"; color: "amber"; registrationId: string; name: string; passCode: string; scannedAt: string }
  | { result: "unpaid"; color: "amber"; registrationId: string; name: string; passCode: string; amountPaise: number; claimedUtr: string | null }
  | { result: "invalid"; color: "red"; reason: InvalidReason; message: string };

export type InvalidReason = "unknown" | "other_event" | "cancelled" | "waitlisted" | "event_closed";

export interface CheckInInput {
  eventId: string;
  /** Raw token or the full QR text (evntcult://p/<token>). Either this or registrationId. */
  passToken?: string;
  /** Manual check-in from the gate's guest-list search (§9: "manual search against cached list"). */
  registrationId?: string;
  clientScanId: string;
  deviceId?: string | null;
  /** The volunteer collected the fee for an unpaid pass and tapped "Admit". */
  acceptUnpaid?: boolean;
  /** When the scan happened (offline scans are synced later). Defaults to now. */
  scannedAt?: Date;
  actorId?: string | null;
  now?: Date;
}

interface PassLookup {
  reg_id: string;
  event_id: string;
  status: "registered" | "waitlisted" | "cancelled";
  payment_status: "paid" | "unpaid";
  pass_code: string;
  name: string;
  price_paise: number;
  event_title: string;
  upi_utr: string | null;
}

const invalid = (reason: InvalidReason, message: string): ScanResult => ({ result: "invalid", color: "red", reason, message });

/** Offline scans may report an earlier time, but never the future or more than a day back. */
function clampScanTime(scannedAt: Date | undefined, now: Date): string {
  const t = scannedAt?.getTime();
  if (t === undefined || Number.isNaN(t) || t > now.getTime() || t < now.getTime() - 86_400_000) return now.toISOString();
  return new Date(t).toISOString();
}

export async function checkIn(db: D1Database, input: CheckInInput): Promise<ScanResult> {
  const now = input.now ?? new Date();
  const manual = !input.passToken && !!input.registrationId;
  const token = manual ? "" : extractPassToken(input.passToken ?? "");

  // 1. Replay of a scan we've already processed (offline queue sent it twice).
  const replay = await db
    .prepare(
      `SELECT c.scanned_at, r.id AS reg_id, r.pass_code, u.name, c.event_id FROM checkins c
         JOIN registrations r ON r.id = c.registration_id JOIN users u ON u.id = r.user_id
        WHERE c.client_scan_id = ?`,
    )
    .bind(input.clientScanId)
    .first<{ scanned_at: string; reg_id: string; pass_code: string; name: string; event_id: string }>();
  if (replay && replay.event_id === input.eventId) {
    return { result: "admitted", color: "green", registrationId: replay.reg_id, name: replay.name, passCode: replay.pass_code, scannedAt: replay.scanned_at, replay: true };
  }

  // 2. Is it a real pass, for this event, with a seat?
  if (!manual && !isWellFormedPassToken(token)) return invalid("unknown", "Not an EvntCult pass.");
  const pass = await db
    .prepare(
      `SELECT r.id AS reg_id, r.event_id, r.status, r.payment_status, r.pass_code, u.name, e.price_paise, e.title AS event_title, r.upi_utr
         FROM registrations r JOIN users u ON u.id = r.user_id JOIN events e ON e.id = r.event_id
        WHERE ${manual ? "r.id" : "r.pass_token"} = ?`,
    )
    .bind(manual ? input.registrationId : token)
    .first<PassLookup>();
  if (!pass) return invalid("unknown", "Not a valid pass. It may be fake or an old cancelled pass.");
  if (pass.event_id !== input.eventId) return invalid("other_event", `This pass is for a different event: ${pass.event_title}.`);
  if (pass.status === "cancelled") return invalid("cancelled", `${pass.name} cancelled this registration.`);
  if (pass.status === "waitlisted") return invalid("waitlisted", `${pass.name} is on the waitlist and doesn't have a seat.`);

  const event = await db.prepare("SELECT status FROM events WHERE id = ?").bind(input.eventId).first<{ status: string }>();
  if (!event || event.status !== "published") return invalid("event_closed", "This event isn't open for check-in.");

  // 3. Already inside? (Checked before the payment question, so the volunteer isn't asked to collect twice.)
  const existing = await db.prepare("SELECT scanned_at FROM checkins WHERE registration_id = ?").bind(pass.reg_id).first<{ scanned_at: string }>();
  if (existing) return { result: "already_in", color: "amber", registrationId: pass.reg_id, name: pass.name, passCode: pass.pass_code, scannedAt: existing.scanned_at };

  // 4. Paid event, not paid yet: the volunteer collects the fee, then taps Admit (acceptUnpaid).
  const unpaid = pass.price_paise > 0 && pass.payment_status !== "paid";
  if (unpaid && !input.acceptUnpaid) {
    return { result: "unpaid", color: "amber", registrationId: pass.reg_id, name: pass.name, passCode: pass.pass_code, amountPaise: pass.price_paise, claimedUtr: pass.upi_utr };
  }

  // 5. Admit. One statement; the UNIQUE constraints make a second scan a no-op.
  const scannedAt = clampScanTime(input.scannedAt, now);
  const res = await db
    .prepare(
      `INSERT INTO checkins (id, registration_id, event_id, scanned_at, device_id, client_scan_id, method)
       SELECT ?, r.id, r.event_id, ?, ?, ?, ? FROM registrations r WHERE r.id = ? AND r.status = 'registered'
       ON CONFLICT DO NOTHING`,
    )
    .bind(newId(), scannedAt, input.deviceId ?? null, input.clientScanId, manual ? "manual" : "qr", pass.reg_id)
    .run();

  if ((res.meta.changes ?? 0) === 1) {
    await db
      .prepare("INSERT INTO audit_log (id, actor_id, action, target_id, meta, created_at) VALUES (?, ?, 'checkin', ?, ?, ?)")
      .bind(newId(), input.actorId ?? null, pass.reg_id, JSON.stringify({ event_id: input.eventId, client_scan_id: input.clientScanId, ...(unpaid ? { unpaid_admitted: true } : {}) }), now.toISOString())
      .run();
    await issueOnCheckIn(db, pass.reg_id, input.eventId, now);
    await enqueueCheckedIn(db, pass.reg_id, now);
    return { result: "admitted", color: "green", registrationId: pass.reg_id, name: pass.name, passCode: pass.pass_code, scannedAt, replay: false };
  }

  // Lost a race: another device admitted this pass a moment ago (or this same scan id did).
  const winner = await db.prepare("SELECT scanned_at, client_scan_id FROM checkins WHERE registration_id = ?").bind(pass.reg_id).first<{ scanned_at: string; client_scan_id: string | null }>();
  if (winner?.client_scan_id === input.clientScanId) {
    return { result: "admitted", color: "green", registrationId: pass.reg_id, name: pass.name, passCode: pass.pass_code, scannedAt: winner.scanned_at, replay: true };
  }
  if (winner) return { result: "already_in", color: "amber", registrationId: pass.reg_id, name: pass.name, passCode: pass.pass_code, scannedAt: winner.scanned_at };
  return invalid("cancelled", "This registration changed while scanning. Scan again.");
}

/** How many people are inside, and how many have a seat. */
export async function gateCounts(db: D1Database, eventId: string): Promise<{ checkedIn: number; registered: number }> {
  const row = await db
    .prepare(
      `SELECT (SELECT COUNT(*) FROM checkins WHERE event_id = ?1) AS checkedIn,
              (SELECT COUNT(*) FROM registrations WHERE event_id = ?1 AND status = 'registered') AS registered`,
    )
    .bind(eventId)
    .first<{ checkedIn: number; registered: number }>();
  return { checkedIn: row?.checkedIn ?? 0, registered: row?.registered ?? 0 };
}

/* ─── Offline guest list ───────────────────────────────────────────────── */

/** SHA-256 of a pass token, hex. The scanner compares hashes, so the list can't be used to make passes. */
export async function tokenHash(token: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(extractPassToken(token)));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export interface ManifestEntry {
  /** sha256(pass token), hex */
  h: string;
  /** registration id, for manual check-in and undo from the gate */
  r: string;
  name: string;
  code: string;
  /** must collect the fee at the gate */
  unpaid: boolean;
  /** scanned_at if already checked in */
  in: string | null;
  /** item id -> when this pass collected it */
  m?: Record<string, string>;
}

export interface Manifest {
  eventId: string;
  title: string;
  pricePaise: number;
  generatedAt: string;
  entries: ManifestEntry[];
  merch?: { id: string; label: string; left: number | null }[];
}

/** Everyone with a seat, for offline checking. No phone numbers, no emails, no raw tokens. */
export async function buildManifest(db: D1Database, eventId: string, now = new Date()): Promise<Manifest | null> {
  const event = await db.prepare("SELECT id, title, price_paise FROM events WHERE id = ?").bind(eventId).first<{ id: string; title: string; price_paise: number }>();
  if (!event) return null;
  const rows = await db
    .prepare(
      `SELECT r.id, r.pass_token, r.pass_code, r.payment_status, u.name, c.scanned_at
         FROM registrations r JOIN users u ON u.id = r.user_id LEFT JOIN checkins c ON c.registration_id = r.id
        WHERE r.event_id = ? AND r.status = 'registered'`,
    )
    .bind(eventId)
    .all<{ id: string; pass_token: string; pass_code: string; payment_status: string; name: string; scanned_at: string | null }>();
  const items = await db.prepare("SELECT id, name, variant, stock FROM merch_items WHERE event_id = ? ORDER BY created_at, id").bind(eventId).all<{ id: string; name: string; variant: string | null; stock: number | null }>();
  const claims = await db
    .prepare("SELECT c.registration_id, c.item_id, c.claimed_at FROM merch_claims c JOIN merch_items m ON m.id = c.item_id WHERE m.event_id = ?")
    .bind(eventId)
    .all<{ registration_id: string; item_id: string; claimed_at: string }>();
  const claimed = new Map<string, Record<string, string>>();
  for (const c of claims.results ?? []) claimed.set(c.registration_id, { ...claimed.get(c.registration_id), [c.item_id]: c.claimed_at });
  const entries = await Promise.all(
    (rows.results ?? []).map(async (r) => ({
      h: await tokenHash(r.pass_token),
      r: r.id,
      name: r.name,
      code: r.pass_code,
      unpaid: event.price_paise > 0 && r.payment_status !== "paid",
      in: r.scanned_at,
      m: claimed.get(r.id),
    })),
  );
  return { eventId: event.id, title: event.title, pricePaise: event.price_paise, generatedAt: now.toISOString(), entries, merch: (items.results ?? []).map((i) => ({ id: i.id, label: i.variant ? `${i.name} · ${i.variant}` : i.name, left: i.stock })) };
}
