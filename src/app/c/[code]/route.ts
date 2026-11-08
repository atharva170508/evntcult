import { getDB } from "@/lib/db";
import { OrganizerError, resolveShortCode } from "@/lib/data/organizer-events";

export const dynamic = "force-dynamic";

/** /c/:code: the short link for a private event. 302 to the event, limited to 20 wrong codes a minute per IP. */
export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const url = new URL(req.url);
  const ip = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  try {
    const target = await resolveShortCode(await getDB(), decodeURIComponent(code), ip);
    return Response.redirect(new URL(target ?? "/dashboard?code=not-found", url.origin), 302);
  } catch (e) {
    if (e instanceof OrganizerError) return new Response(e.message, { status: e.status, headers: { "Retry-After": "60" } });
    throw e;
  }
}
