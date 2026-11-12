import { newId } from "@/lib/tokens";

/** Who may host (master prompt: hosting is strictly for verified organizers). */
export type HostStatus = "none" | "pending" | "approved" | "rejected";

export const canHost = (role: string) => role === "organizer" || role === "admin";

export class HostError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

async function audit(db: D1Database, actor: string | null, action: string, target: string, meta: object, at: string) {
  await db.prepare("INSERT INTO audit_log (id, actor_id, action, target_id, meta, created_at) VALUES (?, ?, ?, ?, ?, ?)").bind(newId(), actor, action, target, JSON.stringify(meta), at).run();
}

export async function hostStatus(db: D1Database, userId: string) {
  return db
    .prepare("SELECT role, host_status AS status, host_club AS club, host_note AS note, host_applied_at AS appliedAt, host_decided_at AS decidedAt FROM users WHERE id = ?")
    .bind(userId)
    .first<{ role: string; status: HostStatus; club: string | null; note: string | null; appliedAt: string | null; decidedAt: string | null }>();
}

/** A student applies (or re-applies after a rejection). Organizers and pending applicants can't apply again. */
export async function applyToHost(db: D1Database, userId: string, input: { club: string; note: string }, now = new Date()) {
  const at = now.toISOString();
  const res = await db
    .prepare(
      `UPDATE users SET host_status = 'pending', host_club = ?1, host_note = ?2, host_applied_at = ?3, host_decided_at = NULL
        WHERE id = ?4 AND role = 'attendee' AND host_status IN ('none', 'rejected')`,
    )
    .bind(input.club, input.note, at, userId)
    .run();
  if (!res.meta.changes) {
    const cur = await hostStatus(db, userId);
    if (cur && canHost(cur.role)) throw new HostError(409, "already_organizer", "You can already host events.");
    throw new HostError(409, "already_pending", "Your application is already with the admins.");
  }
  await audit(db, userId, "host_apply", userId, { club: input.club }, at);
}

/** Admin decision. Approve makes them an organizer; both only apply to a pending application. */
export async function decideHost(db: D1Database, userId: string, approve: boolean, now = new Date()) {
  const at = now.toISOString();
  const res = await db
    .prepare(
      approve
        ? "UPDATE users SET host_status = 'approved', role = 'organizer', host_decided_at = ?1 WHERE id = ?2 AND host_status = 'pending' AND role = 'attendee'"
        : "UPDATE users SET host_status = 'rejected', host_decided_at = ?1 WHERE id = ?2 AND host_status = 'pending'",
    )
    .bind(at, userId)
    .run();
  if (!res.meta.changes) throw new HostError(409, "no_change", "That application was already decided, or it no longer exists.");
  await audit(db, null, approve ? "owner_approve_host" : "owner_reject_host", userId, { by: "owner" }, at);
  if (approve) await audit(db, null, "role_change", userId, { from: "attendee", to: "organizer", reason: "host_approved" }, at);
}

export async function pendingHosts(db: D1Database) {
  return (
    await db
      .prepare("SELECT id, name, email, host_club AS club, host_note AS note, host_applied_at AS appliedAt FROM users WHERE host_status = 'pending' ORDER BY host_applied_at")
      .all<{ id: string; name: string; email: string; club: string | null; note: string | null; appliedAt: string }>()
  ).results ?? [];
}
