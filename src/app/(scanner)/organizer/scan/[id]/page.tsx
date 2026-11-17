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
export const viewport: Viewport = { themeColor: "#0C0C0B", colorScheme: "dark" };

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
        <span className="grid size-12 place-items-center rounded-full bg-[#D6342A]/20">
          <ShieldAlert className="size-6 text-[#FF8A80]" aria-hidden />
        </span>
        <h1 className="text-[32px] font-semibold leading-[1.05] tracking-[-0.04em]">Only this event&apos;s organizer can scan passes.</h1>
        <p className="text-[15px] text-white/65">If you&apos;re helping at the gate, ask the organizer to scan, or to sign in on this phone.</p>
        <Link href="/dashboard" className="mt-2 inline-flex h-11 w-fit items-center gap-1.5 rounded-[10px] bg-white/[0.08] px-4 text-[14px] font-medium text-white transition-colors hover:bg-white/[0.14]">
          <ArrowLeft className="size-4" aria-hidden /> Dashboard
        </Link>
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
