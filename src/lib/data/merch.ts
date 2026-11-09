/**
 * Goodies: an item an attendee can claim once, by scanning their pass, with stock per variant.
 * Takes the D1 database as an argument so tests can use it directly.
 */
import { extractPassToken, newId } from "@/lib/tokens";
import { ActionError, csvCell } from "@/lib/data/organizer-actions";

export interface MerchItem {
  id: string;
  name: string;
  variant: string | null;
  /** How many are left. Null is unlimited. */
  left: number | null;
  claimed: number;
}

export interface PassMerchLine {
  id: string;
  label: string;
  left: number | null;
  claimedAt: string | null;
}

export type ClaimResult =
  | { result: "claimed"; claimedAt: string; left: number | null; replay: boolean }
  | { result: "already_claimed"; claimedAt: string; left: number | null }
  | { result: "sold_out"; message: string; claimed: number }
  | { result: "invalid"; message: string };

export const merchLabel = (i: { name: string; variant: string | null }) => (i.variant ? `${i.name} · ${i.variant}` : i.name);

export async function listMerch(db: D1Database, eventId: string): Promise<MerchItem[]> {
  const rows = await db
    .prepare(
      `SELECT m.id, m.name, m.variant, m.stock, (SELECT COUNT(*) FROM merch_claims c WHERE c.item_id = m.id) AS claimed
         FROM merch_items m WHERE m.event_id = ? ORDER BY m.created_at, m.id`,
    )
    .bind(eventId)
    .all<{ id: string; name: string; variant: string | null; stock: number | null; claimed: number }>();
  return (rows.results ?? []).map((r) => ({ id: r.id, name: r.name, variant: r.variant, left: r.stock, claimed: r.claimed }));
}

export async function createMerchItem(db: D1Database, eventId: string, input: { name: string; variant?: string | null; stock?: number | null }, now = new Date()) {
  const id = newId();
  await db.prepare("INSERT INTO merch_items (id, event_id, name, variant, stock, created_at) VALUES (?, ?, ?, ?, ?, ?)").bind(id, eventId, input.name, input.variant || null, input.stock ?? null, now.toISOString()).run();
  return id;
}

/** Only an item nobody has collected can be removed, so the record of who got what stays true. */
export async function deleteMerchItem(db: D1Database, eventId: string, itemId: string) {
  const res = await db.prepare("DELETE FROM merch_items WHERE id = ?1 AND event_id = ?2 AND NOT EXISTS (SELECT 1 FROM merch_claims c WHERE c.item_id = ?1)").bind(itemId, eventId).run();
  if (!res.meta.changes) throw new ActionError(409, "has_claims", "Someone already collected this, so it can't be removed.");
}

export async function merchItemEvent(db: D1Database, itemId: string) {
  return (await db.prepare("SELECT event_id FROM merch_items WHERE id = ?").bind(itemId).first<{ event_id: string }>())?.event_id ?? null;
}

/** What this pass can collect. Shown on the scanner. */
export async function passMerch(db: D1Database, eventId: string, passToken: string): Promise<PassMerchLine[]> {
  const rows = await db
    .prepare(
      `SELECT m.id, m.name, m.variant, m.stock, c.claimed_at
         FROM merch_items m
         LEFT JOIN registrations r ON r.pass_token = ?2 AND r.event_id = ?1
         LEFT JOIN merch_claims c ON c.item_id = m.id AND c.registration_id = r.id
        WHERE m.event_id = ?1 ORDER BY m.created_at, m.id`,
    )
    .bind(eventId, extractPassToken(passToken))
    .all<{ id: string; name: string; variant: string | null; stock: number | null; claimed_at: string | null }>();
  return (rows.results ?? []).map((r) => ({ id: r.id, label: merchLabel(r), left: r.stock, claimedAt: r.claimed_at }));
}

/**
 * Give one item to one pass. Safe to repeat: the same client_claim_id returns the first
 * result (offline replays), and a second claim for the same pass changes nothing.
 */
export async function claimMerch(db: D1Database, input: { token: string; itemId: string; clientClaimId: string; actorId?: string | null; claimedAt?: Date; now?: Date }): Promise<ClaimResult> {
  const now = input.now ?? new Date();
  const item = await db.prepare("SELECT id, event_id, name, variant, stock FROM merch_items WHERE id = ?").bind(input.itemId).first<{ id: string; event_id: string; name: string; variant: string | null; stock: number | null }>();
  if (!item) return { result: "invalid", message: "That item no longer exists." };

  const replay = await db.prepare("SELECT claimed_at FROM merch_claims WHERE client_claim_id = ?").bind(input.clientClaimId).first<{ claimed_at: string }>();
  if (replay) return { result: "claimed", claimedAt: replay.claimed_at, left: item.stock, replay: true };

  const reg = await db.prepare("SELECT id, status FROM registrations WHERE pass_token = ? AND event_id = ?").bind(extractPassToken(input.token), item.event_id).first<{ id: string; status: string }>();
  if (!reg || reg.status !== "registered") return { result: "invalid", message: "This pass can't collect goodies." };

  const previous = () => db.prepare("SELECT claimed_at FROM merch_claims WHERE registration_id = ? AND item_id = ?").bind(reg.id, item.id).first<{ claimed_at: string }>();
  const before = await previous();
  if (before) return { result: "already_claimed", claimedAt: before.claimed_at, left: item.stock };

  // Stock first, in one statement, so two scanners can never give away the last one twice.
  const took = await db.prepare("UPDATE merch_items SET stock = stock - 1 WHERE id = ? AND (stock IS NULL OR stock > 0)").bind(item.id).run();
  if ((took.meta.changes ?? 0) !== 1) {
    const count = await db.prepare("SELECT COUNT(*) AS n FROM merch_claims WHERE item_id = ?").bind(item.id).first<{ n: number }>();
    return { result: "sold_out", message: `No ${item.variant ?? item.name} left`, claimed: count?.n ?? 0 };
  }

  const claimedAt = (input.claimedAt && input.claimedAt.getTime() <= now.getTime() && input.claimedAt.getTime() > now.getTime() - 86_400_000 ? input.claimedAt : now).toISOString();
  const res = await db
    .prepare("INSERT INTO merch_claims (id, registration_id, item_id, claimed_at, claimed_by, client_claim_id) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT DO NOTHING")
    .bind(newId(), reg.id, item.id, claimedAt, input.actorId ?? null, input.clientClaimId)
    .run();
  const left = item.stock === null ? null : item.stock - 1;
  if ((res.meta.changes ?? 0) === 1) return { result: "claimed", claimedAt, left, replay: false };

  // Lost a race with another scanner: give the unit back.
  await db.prepare("UPDATE merch_items SET stock = stock + 1 WHERE id = ? AND stock IS NOT NULL").bind(item.id).run();
  const winner = await previous();
  return { result: "already_claimed", claimedAt: winner?.claimed_at ?? claimedAt, left: item.stock };
}

/** "Collected 201 of 240 passes". */
export async function merchCollected(db: D1Database, eventId: string): Promise<{ collected: number; passes: number }> {
  const row = await db
    .prepare(
      `SELECT (SELECT COUNT(DISTINCT c.registration_id) FROM merch_claims c JOIN merch_items m ON m.id = c.item_id WHERE m.event_id = ?1) AS collected,
              (SELECT COUNT(*) FROM registrations WHERE event_id = ?1 AND status = 'registered') AS passes`,
    )
    .bind(eventId)
    .first<{ collected: number; passes: number }>();
  return { collected: row?.collected ?? 0, passes: row?.passes ?? 0 };
}

export async function merchClaimsCsv(db: D1Database, eventId: string): Promise<string> {
  const rows = await db
    .prepare(
      `SELECT u.name, u.email, r.pass_code, m.name AS item, m.variant, c.claimed_at
         FROM merch_claims c JOIN merch_items m ON m.id = c.item_id JOIN registrations r ON r.id = c.registration_id JOIN users u ON u.id = r.user_id
        WHERE m.event_id = ? ORDER BY c.claimed_at`,
    )
    .bind(eventId)
    .all<{ name: string; email: string; pass_code: string; item: string; variant: string | null; claimed_at: string }>();
  const line = (cells: (string | null)[]) => cells.map(csvCell).join(",");
  return "﻿" + [line(["Name", "Email", "Pass code", "Item", "Variant", "Claimed (UTC)"]), ...(rows.results ?? []).map((r) => line([r.name, r.email, r.pass_code, r.item, r.variant, r.claimed_at]))].join("\r\n") + "\r\n";
}
