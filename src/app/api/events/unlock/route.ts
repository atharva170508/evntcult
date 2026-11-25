import { ApiError, handle, parseBody } from "@/lib/api";
import { requireUser } from "@/lib/rbac";
import { first, getDB } from "@/lib/db";
import { normalizeAccessCode } from "@/lib/tokens";
import { isValidCustomCode } from "@/lib/organizer/shared";
import { clientIp } from "@/lib/auth-shared";
import { unlockSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

const MISS_LIMIT = 20;

/** POST /api/events/unlock — join/private event code lookup with per-IP brute-force rate limit. */
export const POST = handle(async (req: Request) => {
  const viewer = await requireUser();
  const { code } = await parseBody(req, unlockSchema);
  const ip = clientIp(req) ?? `u:${viewer.id}`;
  const db = await getDB();
  const now = new Date();
  const since = new Date(now.getTime() - 60_000).toISOString();

  const misses =
    (
      await db
        .prepare("SELECT COUNT(*) AS n FROM link_code_misses WHERE ip = ? AND at > ?")
        .bind(ip, since)
        .first<{ n: number }>()
    )?.n ?? 0;

  if (misses >= MISS_LIMIT) {
    throw new ApiError(429, "rate_limited", "Too many wrong codes. Wait a minute and try again.");
  }

  const c = normalizeAccessCode(code);
  const fail = async () => {
    await db
      .prepare("INSERT INTO link_code_misses (ip, at) VALUES (?, ?)")
      .bind(ip, now.toISOString())
      .run();
    throw new ApiError(404, "code_not_found", "That code didn't match an event. Check it with the organizer.");
  };

  if (!isValidCustomCode(c)) await fail();
  const e = await first<{ title: string; slug: string }>(
    "SELECT title, slug FROM events WHERE access_code = ? AND status = 'published'",
    c,
  );
  if (!e) await fail();
  return Response.json({ event: e }, { headers: { "Cache-Control": "no-store" } });
});
