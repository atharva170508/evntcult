import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/rbac";
import { EventForm } from "@/components/events/EventForm";

export const metadata: Metadata = { title: "New event" };
export const dynamic = "force-dynamic";

export default async function NewEventPage() {
  const viewer = await getViewer();
  if (!viewer?.verifiedOrganizer) redirect("/dashboard");
  return (
    <div className="mx-auto max-w-3xl space-y-5 pt-4 md:pt-6">
      <header>
        <p className="eyebrow">Organizer</p>
        <h1 className="headline mt-1 text-[clamp(28px,4vw,38px)] tracking-tightest">New event</h1>
        <p className="mt-1 text-[14px] text-ink-muted">Publishing checks for venue clashes first. Save as draft to decide later.</p>
      </header>
      <EventForm mode="create" />
    </div>
  );
}
