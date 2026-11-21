import type { Metadata, Viewport } from "next";
import { redirect } from "next/navigation";
import { first, getDB } from "@/lib/db";
import { gateCounts } from "@/lib/data/checkins";
import { canManageEvent, getViewer } from "@/lib/rbac";
import { volunteerForEvent } from "@/lib/volunteers";
import { GateScanner } from "@/components/scanner/GateScanner";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Volunteer scanner", robots: { index: false } };
export const viewport: Viewport = { themeColor: "#0C0C0B", colorScheme: "dark" };

/** The scanner as a volunteer sees it: one event, entry (and maybe merch), nothing else. */
export default async function VolunteerGatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const link = await volunteerForEvent(id);
  if (!link) {
    const viewer = await getViewer();
    if (viewer && (await canManageEvent(viewer, id))) redirect(`/organizer/scan/${id}`);
    redirect("/gate/expired");
  }
  const event = await first<{ id: string; slug: string; title: string; venue: string; status: string; price_paise: number; starts_at: string; ends_at: string }>(
    "SELECT id, slug, title, venue, status, price_paise, starts_at, ends_at FROM events WHERE id = ?",
    id,
  );
  if (!event) redirect("/gate/expired");
  const counts = await gateCounts(await getDB(), event.id);
  return (
    <GateScanner
      event={{ id: event.id, slug: event.slug, title: event.title, venue: event.venue, status: event.status, pricePaise: event.price_paise, startsAt: event.starts_at, endsAt: event.ends_at }}
      initialCounts={counts}
      volunteer={{ label: link.label, canMerch: link.role === "gate_merch" }}
    />
  );
}
