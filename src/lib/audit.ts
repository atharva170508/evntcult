import "server-only";
import { run } from "@/lib/db";
import { newId } from "@/lib/tokens";
import { nowIso } from "@/lib/time";

export type AuditAction =
  | "register"
  | "cancel"
  | "capacity_change"
  | "checkin"
  | "payment"
  | "event_create"
  | "event_update"
  | "phone_update"
  | "profile_update"
  // Written by src/lib/data/registrations.ts (it writes with its own db handle so the cron can use it):
  | "hold_offered"
  | "hold_expired"
  | "waitlist_confirm"
  // Written by src/lib/data/photos.ts:
  | "photo_upload"
  | "photo_delete"
  | "role_change";

/** Append-only audit trail. */
export async function audit(actorId: string | null, action: AuditAction, targetId: string | null, meta?: Record<string, unknown>) {
  await run(
    "INSERT INTO audit_log (id, actor_id, action, target_id, meta, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    newId(),
    actorId,
    action,
    targetId,
    meta ? JSON.stringify(meta) : null,
    nowIso(),
  );
}
