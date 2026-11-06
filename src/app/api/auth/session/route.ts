import { z } from "zod";
import { first, run } from "@/lib/db";
import { ApiError, handle, parseBody } from "@/lib/api";
import { clearSessionCookieHeader, createSessionValue, sessionCookieHeader } from "@/lib/session";
import { newId } from "@/lib/tokens";
import { nowIso } from "@/lib/time";

export const dynamic = "force-dynamic";

const body = z
  .object({
    email: z.string().trim().toLowerCase().email().max(200),
    name: z.string().trim().min(2).max(80).optional(),
  })
  .strict();

function domainAllowed(email: string): boolean {
  const list = (process.env.ALLOWED_EMAIL_DOMAINS ?? "")
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
  return list.length === 0 || list.includes(email.split("@")[1] ?? "");
}

/** POST /api/auth/session — college email in, signed httpOnly cookie out. */
export const POST = handle(async (req: Request) => {
  const { email, name } = await parseBody(req, body);
  if (!domainAllowed(email)) throw new ApiError(403, "domain_not_allowed", "Use your college email address.");

  let user = await first<{ id: string }>("SELECT id FROM users WHERE email = ?", email);
  if (!user) {
    if (!name) throw new ApiError(400, "name_required", "Tell us your name to create your account.");
    const id = newId();
    await run("INSERT INTO users (id, email, name, role, created_at) VALUES (?, ?, ?, 'attendee', ?)", id, email, name, nowIso());
    user = { id };
  }

  const res = Response.json({ ok: true });
  res.headers.append("Set-Cookie", sessionCookieHeader(await createSessionValue(user.id)));
  return res;
});

/** DELETE /api/auth/session — log out. */
export const DELETE = handle(async () => {
  const res = Response.json({ ok: true });
  res.headers.append("Set-Cookie", clearSessionCookieHeader());
  return res;
});
