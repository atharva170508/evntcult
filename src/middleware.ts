import { NextResponse, type NextRequest } from "next/server";
import { readSessionValue, SESSION_COOKIE } from "@/lib/session";

/**
 * Everything except the landing page (/dashboard for visitors) and sign-in needs a session (M9):
 * visitors see a preview on the landing page and are asked to sign up to open real events.
 * Only verifies the cookie signature; roles are checked against the database in each page / route.
 */
const PROTECTED = ["/passes", "/vault", "/organizer", "/events", "/calendar", "/venues", "/certificates", "/profile", "/host"];

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  // A shared event link opens for anyone. Registering still needs an account.
  if (/^\/events\/[^/]+$/.test(path)) return NextResponse.next();
  if (!PROTECTED.some((p) => path === p || path.startsWith(`${p}/`))) return NextResponse.next();
  const uid = await readSessionValue(req.cookies.get(SESSION_COOKIE)?.value);
  if (uid) return NextResponse.next();
  const url = new URL("/signin", req.url);
  url.searchParams.set("next", path + req.nextUrl.search);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|sw.js|.*\\.(?:png|jpg|svg|webp|js)$).*)"],
};
