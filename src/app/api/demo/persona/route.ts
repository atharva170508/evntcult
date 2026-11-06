import { NextResponse } from "next/server";
import { isDemoMode } from "@/lib/env";
import { DEMO_PERSONA_COOKIE } from "@/lib/rbac";

/** GET /api/demo/persona?as=attendee|organizer — demo mode only. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  if (!isDemoMode()) return new Response("Not found", { status: 404 });

  const as = url.searchParams.get("as") === "attendee" ? "attendee" : "organizer";
  const back = url.searchParams.get("next") ?? "/dashboard";
  const res = NextResponse.redirect(new URL(back.startsWith("/") ? back : "/dashboard", url));
  res.cookies.set(DEMO_PERSONA_COOKIE, as, { path: "/", sameSite: "lax", httpOnly: true, maxAge: 60 * 60 * 24 * 30 });
  return res;
}
