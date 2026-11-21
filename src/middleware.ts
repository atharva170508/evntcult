import { NextResponse, type NextRequest } from "next/server";
import { readSessionValue, SESSION_COOKIE } from "@/lib/session";

/**
 * Everything except the homepage (/dashboard for visitors), sign-in, the terms page and the app
 * install page needs a session. Real event details, share links (/e, /c) and certificates
 * (/certificates, /verify) are for signed-in people only; visitors are sent to sign in and come back.
 * Only verifies the cookie signature; roles are checked against the database in each page / route.
 * Also passes the path on as x-path, so layouts can send people back after accepting the terms.
 */
/** Link-preview crawlers (WhatsApp, Telegram, Instagram/Facebook, X, Slack, Discord, LinkedIn...). */
const PREVIEW_BOT = /whatsapp|facebookexternalhit|facebot|telegrambot|twitterbot|slackbot|discordbot|linkedinbot|skypeuripreview|pinterest|googlebot|bingbot|applebot|snapchat/i;

const PROTECTED = ["/passes", "/vault", "/organizer", "/events", "/calendar", "/venues", "/certificates", "/profile", "/host", "/hosts", "/e", "/c", "/verify"];

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const headers = new Headers(req.headers);
  headers.set("x-path", path + req.nextUrl.search);
  const pass = () => NextResponse.next({ request: { headers } });
  if (!PROTECTED.some((p) => path === p || path.startsWith(`${p}/`))) return pass();
  // Shared event links: preview bots get a small page with the title, date and poster.
  const ev = /^\/events\/([^/]+)\/?$/.exec(path);
  if (ev && PREVIEW_BOT.test(req.headers.get("user-agent") ?? "")) {
    return NextResponse.rewrite(new URL(`/api/share/${ev[1]}`, req.url));
  }
  const uid = await readSessionValue(req.cookies.get(SESSION_COOKIE)?.value);
  if (uid) return pass();
  const url = new URL("/signin", req.url);
  url.searchParams.set("next", path + req.nextUrl.search);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|sw.js|.*\\.(?:png|jpg|svg|webp|js)$).*)"],
};
