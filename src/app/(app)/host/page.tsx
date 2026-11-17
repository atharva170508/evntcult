import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/rbac";
import { getDB } from "@/lib/db";
import { hostStatus } from "@/lib/data/hosting";
import { fmtDate } from "@/lib/utils";
import { Notice } from "@/components/ui/Field";
import { HostApplyForm } from "@/components/profile/HostApplyForm";

export const metadata: Metadata = { title: "Host events" };
export const dynamic = "force-dynamic";

/** Hosting is for approved organizers. Everyone else applies here, and the owner decides. */
export default async function HostPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/signin?next=/host");
  if (viewer.verifiedOrganizer) redirect("/organizer");
  const status = await hostStatus(await getDB(), viewer.id);

  return (
    <div className="mx-auto max-w-[640px] pb-12">
      <header className="pb-6 pt-8 md:pt-12">
        <h1 className="font-display text-[clamp(40px,5vw,56px)] leading-none tracking-[-0.03em] text-ink">
          Host <em>on EvntCult.</em>
        </h1>
        <p className="mt-3 text-[16px] text-ink-2">Organizer accounts are approved by EvntCult, so every event on campus comes from a real club.</p>
      </header>

      {status?.status === "pending" ? (
        <Notice tone="accent">
          Your application for <b>{status.club}</b> is with the admins
          {status.appliedAt ? ` (sent ${fmtDate(new Date(status.appliedAt), { day: "numeric", month: "short" })})` : ""}. Once it&apos;s approved, &ldquo;Switch to hosting&rdquo; appears in your account menu.
        </Notice>
      ) : (
        <div className="space-y-4">
          {status?.status === "rejected" && <Notice tone="warn">Your last application wasn&apos;t approved. You can apply again.</Notice>}
          <HostApplyForm />
        </div>
      )}
    </div>
  );
}
