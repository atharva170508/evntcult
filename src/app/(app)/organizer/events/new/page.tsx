import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/rbac";
import { EventForm } from "@/components/events/EventForm";
import { PageHero } from "@/components/brand/PageHero";

export const metadata: Metadata = { title: "New event" };
export const dynamic = "force-dynamic";

export default async function NewEventPage() {
  const viewer = await getViewer();
  if (!viewer?.verifiedOrganizer) redirect("/dashboard");
  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-8">
      <PageHero
        eyebrow="Organizer · New event"
        title={
          <>
            Create an <em>event.</em>
          </>
        }
        sub="Publishing checks for venue clashes first. Save as a draft to decide later."
      />
      <EventForm mode="create" />
    </div>
  );
}
