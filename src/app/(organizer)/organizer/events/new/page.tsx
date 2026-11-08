import type { Metadata } from "next";
import { getDB } from "@/lib/db";
import { getViewer } from "@/lib/rbac";
import { defaultPayoutUpi, lastVenue } from "@/lib/data/organizer-events";
import { siteHost } from "@/lib/organizer/page-data";
import { istDate } from "@/lib/organizer/shared";
import { EventEditor } from "@/components/organizer-ui/EventEditor";

export const metadata: Metadata = { title: "Create an event" };
export const dynamic = "force-dynamic";

export default async function NewEventPage() {
  const viewer = (await getViewer())!;
  const db = await getDB();
  const [venue, upi, host] = await Promise.all([lastVenue(db, viewer.id), defaultPayoutUpi(db, viewer.id), siteHost()]);
  return <EventEditor initial={null} host={host} today={istDate(new Date())} lastVenue={venue} defaultUpi={upi} />;
}
