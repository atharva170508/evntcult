import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { canManageEvent, getViewer } from "@/lib/rbac";
import { first } from "@/lib/db";
import { istHm, istYmd } from "@/lib/time";
import type { EventRow } from "@/lib/data/types";
import { EventForm } from "@/components/events/EventForm";

export const metadata: Metadata = { title: "Edit event" };
export const dynamic = "force-dynamic";

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const viewer = await getViewer();
  if (!viewer?.verifiedOrganizer) redirect("/dashboard");
  if (!(await canManageEvent(viewer, id))) notFound();

  const e = await first<EventRow & { taken: number }>(
    "SELECT e.*, (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id AND r.status IN ('registered','waitlisted')) AS taken FROM events e WHERE e.id = ?",
    id,
  );
  if (!e) notFound();
  const start = new Date(e.starts_at);
  const end = new Date(e.ends_at);

  return (
    <div className="mx-auto max-w-3xl space-y-5 pt-4 md:pt-6">
      <header>
        <p className="eyebrow">Organizer · {e.status}</p>
        <h1 className="headline mt-1 text-[clamp(28px,4vw,38px)] tracking-tightest">Edit {e.title}</h1>
      </header>
      <EventForm
        mode="edit"
        eventId={e.id}
        minCapacity={Math.max(1, e.taken)}
        initial={{
          title: e.title,
          description: e.description ?? "",
          category: e.category,
          venue: e.venue,
          date: istYmd(start),
          startTime: istHm(start),
          endTime: istHm(end),
          capacity: e.capacity,
          priceRupees: e.price_paise / 100,
          access: e.access,
          status: e.status,
        }}
      />
    </div>
  );
}
