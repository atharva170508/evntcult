import { NextResponse } from "next/server";
import { linkForToken, touchVolunteer, VOLUNTEER_COOKIE } from "@/lib/volunteers";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ token: string }> };

/** GET /v/:token — a volunteer opens their link: remember it on this phone, go to the scanner. */
export async function GET(req: Request, { params }: Ctx) {
  const { token } = await params;
  const link = await linkForToken(token);
  if (!link) return NextResponse.redirect(new URL("/gate/expired", req.url));
  await touchVolunteer(link.id, false);
  const res = NextResponse.redirect(new URL(`/gate/${link.event_id}`, req.url));
  res.cookies.set(VOLUNTEER_COOKIE, token, {
    httpOnly: true,
    secure: new URL(req.url).protocol === "https:",
    sameSite: "lax",
    path: "/",
    expires: new Date(link.expires_at),
  });
  res.headers.set("Cache-Control", "no-store");
  res.headers.set("Referrer-Policy", "no-referrer");
  return res;
}
