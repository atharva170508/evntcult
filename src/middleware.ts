import { NextResponse, type NextRequest } from "next/server";
import { readSessionValue, SESSION_COOKIE } from "@/lib/session";

/**
 * Everything except the homepage (/dashboard for visitors), sign-in, the terms page and the app
 * install page needs a session. Real event details, share links (/e, /c) and certificates
 * (/certificates, /verify) are for signed-in people only; visitors are sent to sign in and come back.
 * Only verifies the cookie signature; roles are checked against the database in each page / route.
 * Also passes the path on as x-path, so layouts can send people back after accepting the terms.
 */
const PROTECTED = ["/passes", "/vault", "/organizer", "/events", "/calendar", "/venues", "/certificates", "/profile", "/host", "/hosts", "/e", "/c", "/verify"];

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const headers = new Headers(req.headers);
  headers.set("x-path", path + req.nextUrl.search);
  const pass = () => NextResponse.next({ request: { headers } });
  if (!PROTECTED.some((p) => path === p || path.startsWith(`${p}/`))) return pass();
  const uid = await readSessionValue(req.cookies.get(SESSION_COOKIE)?.value);
  if (uid) return pass();
  const url = new URL("/signin", req.url);
  url.searchParams.set("next", path + req.nextUrl.search);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|sw.js|.*\\.(?:png|jpg|svg|webp|js)$).*)"],
};
