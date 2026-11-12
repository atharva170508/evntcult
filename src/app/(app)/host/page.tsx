import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getDB } from "@/lib/db";
import { getViewer } from "@/lib/rbac";
import { hostStatus } from "@/lib/data/hosting";
import { PageHero } from "@/components/brand/PageHero";
import { LinkButton } from "@/components/ui/Button";
import { HostApplyForm } from "@/components/profile/HostApplyForm";

export const metadata: Metadata = { title: "Host events" };
export const dynamic = "force-dynamic";

const fmt = (iso: string) => new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" }).format(new Date(iso));

/** Hosting is for approved organizers. Students apply here; an admin approves in the owner panel. */
export default async function HostPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/signin?next=/host");
  if (viewer.verifiedOrganizer) redirect("/organizer");
  const s = await hostStatus(await getDB(), viewer.id);

  return (
    <div className="flex max-w-prose flex-col gap-8">
      <PageHero eyebrow="Host events" title="Run events on EvntCult" sub="Hosting is for approved organizers, so students only see events from real clubs and groups." />
      {s?.status === "pending" ? (
        <section role="status" className="border-l-2 border-line-strong pl-4">
          <p className="text-title">Your application is with the admins.</p>
          <p className="mt-2 text-body text-ink-muted">
            You applied on <span className="font-mono">{fmt(s.appliedAt!)}</span> for <span className="font-semibold text-ink">{s.club}</span>. You&apos;ll be able to create events as soon as it&apos;s approved.
          </p>
          <div className="mt-4">
            <LinkButton href="/dashboard" variant="secondary" size="sm">
              Back to home
            </LinkButton>
          </div>
        </section>
      ) : (
        <>
          {s?.status === "rejected" && (
            <p role="status" className="border-l-2 border-warn pl-3 text-body">
              Your last application{s.decidedAt ? ` (${fmt(s.decidedAt)})` : ""} wasn&apos;t approved. You can apply again with more detail.
            </p>
          )}
          <HostApplyForm club={s?.club ?? ""} note={s?.note ?? ""} />
        </>
      )}
    </div>
  );
}
