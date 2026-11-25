import { NextResponse, type NextRequest } from "next/server";
import { readSessionValue, SESSION_COOKIE } from "@/lib/session";

/**
 * Security middleware:
 * 1. Enforces strict CSRF Origin/Host verification on all mutating /api/* requests
 *    (excluding /api/webhooks/* which authenticate via HMAC signatures).
 * 2. Protects all member/organizer routes behind signed session verification.
 * 3. Passes sanitized x-path for post-terms redirects.
 */
const PREVIEW_BOT =
  /whatsapp|facebookexternalhit|facebot|telegrambot|twitterbot|slackbot|discordbot|linkedinbot|skypeuripreview|pinterest|googlebot|bingbot|applebot|snapchat/i;

const PROTECTED = [
  "/passes",
  "/vault",
  "/organizer",
  "/events",
  "/calendar",
  "/venues",
  "/certificates",
  "/profile",
  "/host",
  "/hosts",
  "/e",
  "/c",
  "/verify",
];

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function isSameOrigin(req: NextRequest): boolean {
  const host = (req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "").toLowerCase();
  if (!host) return false;
  const origin = req.headers.get("origin");
  if (origin) {
    try {
      return new URL(origin).host.toLowerCase() === host;
    } catch {
      return false;
    }
  }
  const referer = req.headers.get("referer");
  if (referer) {
    try {
      return new URL(referer).host.toLowerCase() === host;
    } catch {
      return false;
    }
  }
  // Browser fetch/form requests always send Origin or Sec-Fetch-Site.
  // Reject explicit cross-site fetches even if Origin was stripped.
  const fetchSite = req.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none") return false;
  return true;
}

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // 1. CSRF Origin check on all state-changing API routes (except HMAC-signed webhooks).
  if (path.startsWith("/api/")) {
    if (MUTATING.has(req.method) && !path.startsWith("/api/webhooks/")) {
      if (!isSameOrigin(req)) {
        return NextResponse.json(
          { error: { code: "csrf_rejected", message: "Cross-origin request blocked." } },
          { status: 403, headers: { "Cache-Control": "no-store" } },
        );
      }
    }
    return NextResponse.next();
  }

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
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sw.js|.*\\.(?:png|jpg|svg|webp|js)$).*)"],
};
