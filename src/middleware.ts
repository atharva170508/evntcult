import { NextResponse, type NextRequest } from "next/server";
import { readSessionValue, SESSION_COOKIE } from "@/lib/session";

/**
 * Signed-in check for app pages. Only verifies the cookie signature; roles are checked
 * against the database inside each page / API route.
 */
const PROTECTED = ["/dashboard", "/calendar", "/events", "/passes", "/vault", "/venues", "/organizer"];

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
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
