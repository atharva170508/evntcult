import { first } from "@/lib/db";
import { SITE_URL } from "@/lib/site";
import { fmtDate, fmtTime } from "@/lib/utils";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ slug: string }> };

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/**
 * What WhatsApp, Telegram, Instagram and friends see when someone shares an event link. The
 * middleware sends link-preview bots here (people still get the real page, behind sign-in).
 * Public events show their title, date and poster; private ones only say there's an invite.
 */
export async function GET(_req: Request, { params }: Ctx) {
  const { slug } = await params;
  const e = await first<{ title: string; tagline: string | null; starts_at: string; venue: string | null; banner_url: string | null; access: string; status: string }>(
    "SELECT title, tagline, starts_at, venue, banner_url, access, status FROM events WHERE slug = ? OR id = ?",
    slug,
    slug,
  ).catch(() => null);

  const open = e && e.status === "published" && e.access === "public";
  const url = `${SITE_URL}/events/${encodeURIComponent(slug)}`;
  const title = open ? `${e.title} · EvntCult` : "You're invited · EvntCult";
  const when = open ? `${fmtDate(new Date(e.starts_at), { weekday: "short", day: "numeric", month: "short" })}, ${fmtTime(new Date(e.starts_at))}` : "";
  const desc = open
    ? [when, e.venue, e.tagline].filter(Boolean).join(". ")
    : "Open the link to see the event and get your pass on EvntCult.";
  const image = open && e.banner_url ? new URL(e.banner_url, SITE_URL).toString() : `${SITE_URL}/og.jpg`;

  const html = `<!doctype html><html lang="en-IN"><head><meta charset="utf-8">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta property="og:type" content="website"><meta property="og:site_name" content="EvntCult">
<meta property="og:url" content="${esc(url)}"><meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}"><meta property="og:image" content="${esc(image)}">
<meta name="twitter:card" content="summary_large_image"><meta name="robots" content="noindex">
<link rel="canonical" href="${esc(url)}"></head><body><a href="${esc(url)}">${esc(title)}</a></body></html>`;
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=300" } });
}
