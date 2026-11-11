import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/rbac";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { PageHero } from "@/components/brand/PageHero";
import { LogoutButton } from "@/components/profile/LogoutButton";

export const metadata: Metadata = { title: "Your profile" };
export const dynamic = "force-dynamic";

const ROLE_LABEL = { attendee: "Member", organizer: "Organizer", admin: "Admin" } as const;

export default async function ProfilePage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/signin?next=/profile");

  return (
    <div className="max-w-prose">
      <PageHero eyebrow="Account" title="Your profile" />

      <dl className="mt-6 border-t border-line">
        <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-4 border-b border-line py-3">
          <dt className="text-label leading-6 text-ink-muted">Email</dt>
          <dd className="min-w-0">
            <span className="block truncate font-mono text-body-sm leading-6">{viewer.email}</span>
            <span className="text-label text-ink-subtle">Used to log in. It can&apos;t be changed.</span>
          </dd>
        </div>
        <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-4 border-b border-line py-3">
          <dt className="text-label leading-6 text-ink-muted">Role</dt>
          <dd className="text-body">{ROLE_LABEL[viewer.role]}</dd>
        </div>
      </dl>

      <ProfileForm name={viewer.name} phone={viewer.phone} whatsappOptIn={viewer.whatsappOptIn} />

      <div className="mt-12 border-t border-line pt-6">
        <LogoutButton />
      </div>
    </div>
  );
}
