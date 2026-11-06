import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { redeemCodeSchema } from "@/lib/validation";
import { requireUser, authErrorResponse } from "@/lib/rbac";
import { isDemoMode } from "@/lib/env";
import { checkCodeUsable, isWellFormedEventCode, normalizeEventCode } from "@/lib/event-code";

/**
 * POST /api/codes/redeem { code }
 * Unlocks a CODE_ONLY event for the user. Registration itself happens on the
 * event page, which re-validates the code inside its own transaction.
 * The same generic error is returned for every failure so codes can't be enumerated.
 */
export async function POST(req: Request) {
  try {
    await requireUser();
  } catch (e) {
    return authErrorResponse(e);
  }

  const parsed = redeemCodeSchema.safeParse(await req.json().catch(() => null));
  const generic = NextResponse.json({ error: "That code isn't valid or has expired." }, { status: 404 });
  if (!parsed.success || !isWellFormedEventCode(parsed.data.code)) return generic;

  if (isDemoMode()) {
    return NextResponse.json({ event: { slug: "neon-night", title: "Neon Night" }, demo: true });
  }

  const row = await prisma.eventCode.findUnique({
    where: { code: normalizeEventCode(parsed.data.code) },
    select: {
      active: true,
      expiresAt: true,
      maxUses: true,
      uses: true,
      event: { select: { slug: true, title: true, status: true } },
    },
  });
  if (!row || !checkCodeUsable(row).ok || !["PUBLISHED", "LIVE"].includes(row.event.status)) return generic;

  return NextResponse.json({ event: { slug: row.event.slug, title: row.event.title } });
}
