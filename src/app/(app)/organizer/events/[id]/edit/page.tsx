import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { canManageEvent, getViewer } from "@/lib/rbac";
import { count, first } from "@/lib/db";
import { istHm, istYmd } from "@/lib/time";
import { EventForm } from "@/components/events/EventForm";
import { PageHero } from "@/components/brand/PageHero";

export const metadata: Metadata = { title: "Edit event" };
export const dynamic = "force-dynamic";

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const viewer = await getViewer();
  if (!viewer) redirect(`/signin?next=/organizer/events/${encodeURIComponent(id)}/edit`);
  if (!viewer.verifiedOrganizer) redirect("/dashboard");
  if (!(await canManageEvent(viewer, id))) notFound();

  const e = await first<{ id: string; title: string; description: string | null; category: string; venue: string; starts_at: string; ends_at: string; capacity: number; price_paise: number; access: "public" | "code"; status: string }>(
    "SELECT id, title, description, category, venue, starts_at, ends_at, capacity, price_paise, access, status FROM events WHERE id = ?",
    id,
  );
  if (!e) notFound();
  const taken = await count("SELECT COUNT(*) AS n FROM registrations WHERE event_id = ? AND status = 'registered'", id);
  const start = new Date(e.starts_at);

  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-8">
      <PageHero eyebrow="Organizer · Edit event" title={e.title} sub="Changes to time or venue are re-checked for clashes. Post an update so attendees know." />
      <EventForm
        mode="edit"
        eventId={e.id}
        minCapacity={Math.max(1, taken)}
        initial={{
          title: e.title,
          description: e.description ?? "",
          category: e.category,
          venue: e.venue,
          date: istYmd(start),
          startTime: istHm(start),
          endTime: istHm(new Date(e.ends_at)),
          capacity: e.capacity,
          priceRupees: Math.round(e.price_paise / 100),
          access: e.access,
          status: e.status,
        }}
      />
    </div>
  );
}
