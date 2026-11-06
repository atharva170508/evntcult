import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { canManageEvent, getViewer } from "@/lib/rbac";
import { first, getDB } from "@/lib/db";
import { gateCounts } from "@/lib/data/checkins";
import { GateScanner } from "@/components/scanner/GateScanner";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Gate scanner" };
export const viewport: Viewport = { themeColor: "#0b0c10", colorScheme: "dark" };

export default async function ScanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const viewer = await getViewer();
  if (!viewer) redirect(`/signin?next=/organizer/scan/${encodeURIComponent(id)}`);

  const event = await first<{ id: string; slug: string; title: string; venue: string; status: string; price_paise: number; starts_at: string; ends_at: string }>(
    "SELECT id, slug, title, venue, status, price_paise, starts_at, ends_at FROM events WHERE id = ?",
    id,
  );

  if (!event || !(await canManageEvent(viewer, event.id))) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 p-6">
        <ShieldAlert className="size-10 text-[#ff6b6b]" />
        <h1 className="font-serif text-[36px] leading-tight">Only this event&apos;s organizer can scan passes.</h1>
        <p className="text-[15px] text-white/70">If you&apos;re helping at the gate, ask the organizer to scan, or to sign in on this phone.</p>
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-white/80 underline"><ArrowLeft className="size-4" /> Dashboard</Link>
      </main>
    );
  }

  const counts = await gateCounts(await getDB(), event.id);
  return (
    <GateScanner
      event={{ id: event.id, slug: event.slug, title: event.title, venue: event.venue, status: event.status, pricePaise: event.price_paise, startsAt: event.starts_at, endsAt: event.ends_at }}
      initialCounts={counts}
    />
  );
}
