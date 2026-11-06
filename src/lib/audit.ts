import "server-only";
import { run } from "@/lib/db";
import { newId } from "@/lib/tokens";
import { nowIso } from "@/lib/time";

export type AuditAction = "register" | "cancel" | "capacity_change" | "checkin" | "payment" | "event_create" | "event_update" | "phone_update";

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
