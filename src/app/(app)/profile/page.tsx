import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BadgeCheck, Mail } from "lucide-react";
import { getViewer } from "@/lib/rbac";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { PageHero } from "@/components/brand/PageHero";
import { initials } from "@/lib/utils";

export const metadata: Metadata = { title: "Your profile" };
export const dynamic = "force-dynamic";

const ROLE_LABEL = { attendee: "Member", organizer: "Organizer", admin: "Admin" } as const;

export default async function ProfilePage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/signin?next=/profile");

  return (
    <div className="pb-8">
      <PageHero eyebrow="Account" title={<>Your <em>profile.</em></>} />

      <div className="mt-10 grid gap-10 lg:grid-cols-[280px_1fr] lg:gap-16">
        <aside className="space-y-6">
          <div className="flex items-center gap-4">
            <span className="grid size-14 shrink-0 place-items-center rounded-full bg-ink text-[18px] font-medium text-white" aria-hidden>
              {initials(viewer.name)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-h4 font-semibold">{viewer.name}</p>
              <p className="mt-0.5 inline-flex items-center gap-1.5 text-[13px] text-ink-muted">
                <BadgeCheck className="size-4 text-live" aria-hidden /> {ROLE_LABEL[viewer.role]}
              </p>
            </div>
          </div>
          <dl className="space-y-1 border-t border-line pt-5">
            <dt className="eyebrow flex items-center gap-1.5">
              <Mail className="size-3.5" aria-hidden /> Email
            </dt>
            <dd className="break-all text-[15px] font-medium">{viewer.email}</dd>
            <dd className="text-[12.5px] text-ink-subtle">Used to log in. It can&apos;t be changed.</dd>
          </dl>
        </aside>

        <ProfileForm name={viewer.name} phone={viewer.phone} whatsappOptIn={viewer.whatsappOptIn} />
      </div>
    </div>
  );
}
