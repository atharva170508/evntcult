import type { Metadata } from "next";
import { ownedRow, siteHost, toEditorInitial } from "@/lib/organizer/page-data";
import { istDate } from "@/lib/organizer/shared";
import { EventEditor } from "@/components/organizer-ui/EventEditor";

export const metadata: Metadata = { title: "Edit event" };
export const dynamic = "force-dynamic";

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [{ row }, host] = await Promise.all([ownedRow(id), siteHost()]);
  return <EventEditor key={`${row.id}:${row.version}`} initial={toEditorInitial(row)} host={host} today={istDate(new Date())} lastVenue={null} defaultUpi={null} />;
}
