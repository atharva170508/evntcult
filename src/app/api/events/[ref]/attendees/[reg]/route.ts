import { ApiError, handle } from "@/lib/api";
import { first, getDB } from "@/lib/db";
import { requireEventOwner } from "@/lib/rbac";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ ref: string; reg: string }> };

const LABEL: Record<string, string> = {
  register: "Registered",
  cancel: "Cancelled",
  checkin: "Checked in",
  payment: "Payment updated",
  hold_offered: "Offered a seat from the waitlist",
  hold_expired: "Seat offer expired",
  waitlist_confirm: "Moved off the waitlist",
  approve: "Approved",
  decline: "Declined",
  request_approve: "Approved",
  request_decline: "Declined",
  payment_mark_paid: "Marked as paid",
  payment_mark_unpaid: "Marked as unpaid",
  cert_issue: "Certificate issued",
};

/**
 * GET — one guest's details for the side panel (Luma's Guest Details): who they are, their pass,
 * and every recorded step with who did it.
 */
export const GET = handle(async (_req: Request, { params }: Ctx) => {
  const { ref, reg } = await params;
  await requireEventOwner(ref);
  const r = await first<{
    id: string; user_id: string; status: string; pass_code: string; created_at: string; checked_in_at: string | null;
    payment_status: string | null; tier: string | null; amount_paise: number | null; name: string; email: string;
  }>(
    `SELECT r.id, r.user_id, r.status, r.pass_code, r.created_at, c.scanned_at AS checked_in_at, r.payment_status, r.tier, r.amount_paise, u.name, u.email
       FROM registrations r JOIN users u ON u.id = r.user_id LEFT JOIN checkins c ON c.registration_id = r.id
      WHERE r.id = ? AND r.event_id = ?`,
    reg,
    ref,
  );
  if (!r) throw new ApiError(404, "not_found", "Guest not found.");
  const db = await getDB();
  const [log, posts, other, sent] = await Promise.all([
    db
      .prepare(
        `SELECT a.action, a.created_at, a.actor_id, u.name AS actor FROM audit_log a LEFT JOIN users u ON u.id = a.actor_id
          WHERE a.target_id = ? ORDER BY a.created_at`,
      )
      .bind(reg)
      .all<{ action: string; created_at: string; actor_id: string | null; actor: string | null }>(),
    first<{ n: number }>("SELECT COUNT(*) AS n FROM event_posts WHERE event_id = ? AND user_id = ?", ref, r.user_id).catch(() => ({ n: 0 })),
    first<{ n: number }>(
      "SELECT COUNT(*) AS n FROM registrations x JOIN events e ON e.id = x.event_id WHERE x.user_id = ? AND e.organizer_id = (SELECT organizer_id FROM events WHERE id = ?) AND x.event_id <> ?",
      r.user_id,
      ref,
      ref,
    ),
    db
      .prepare("SELECT channel, template, status, error, created_at, sent_at FROM notifications WHERE user_id = ? AND event_id = ? ORDER BY created_at")
      .bind(r.user_id, ref)
      .all<{ channel: string; template: string; status: string; error: string | null; created_at: string; sent_at: string | null }>(),
  ]);
  const steps: { label: string; at: string; by: string | null; note?: string; kind?: string }[] = (log.results ?? []).map((l) => ({
    label: LABEL[l.action] ?? l.action.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase()),
    at: l.created_at,
    by: l.actor_id && l.actor_id !== r.user_id ? (l.actor ?? "A volunteer") : null,
  }));
  const MSG: Record<string, string> = {
    email_registered: "Confirmation email",
    email_feedback: "Feedback email",
    registered: "WhatsApp: you're in",
    reminder_24h: "WhatsApp: reminder, a day before",
    reminder_2h: "WhatsApp: reminder, two hours before",
    checked_in: "WhatsApp: checked in",
    certificate_ready: "WhatsApp: certificate ready",
    event_cancelled: "WhatsApp: event cancelled",
    event_changed: "WhatsApp: event changed",
  };
  const STATUS: Record<string, string> = { sent: "Delivered", dry_run: "Not sent: sending is switched off", queued: "Waiting to send", sending: "Sending", failed: "Failed to send" };
  const SKIP: Record<string, string> = { not_opted_in: "they didn't turn on WhatsApp", no_phone: "no phone number", opted_out: "they opted out", cap: "message limit reached", no_email: "no email address", cancelled: "registration cancelled" };
  for (const n of sent.results ?? [])
    steps.push({
      label: MSG[n.template] ?? `${n.channel === "email" ? "Email" : "WhatsApp"}: ${n.template.replace(/_/g, " ")}`,
      at: n.sent_at ?? n.created_at,
      by: null,
      note: n.status === "skipped" ? `Skipped: ${SKIP[n.error ?? ""] ?? n.error ?? "not needed"}` : (STATUS[n.status] ?? n.status),
      kind: "message",
    });
  if (!steps.some((s) => s.label === "Registered")) steps.unshift({ label: "Registered", at: r.created_at, by: null });
  if (r.checked_in_at && !steps.some((s) => s.label === "Checked in")) steps.push({ label: "Checked in", at: r.checked_in_at, by: null });
  steps.sort((a, b) => a.at.localeCompare(b.at));
  return Response.json({
    name: r.name,
    email: r.email,
    status: r.status,
    pass: r.pass_code,
    tier: r.tier,
    amountPaise: r.amount_paise,
    payment: r.payment_status,
    posts: posts?.n ?? 0,
    otherEvents: other?.n ?? 0,
    steps,
  });
});
