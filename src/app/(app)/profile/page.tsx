import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BadgeCheck, Mail } from "lucide-react";
import { getViewer } from "@/lib/rbac";
import { codeLoginOn } from "@/lib/email";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { PageHero } from "@/components/brand/PageHero";

export const metadata: Metadata = { title: "Your profile" };
export const dynamic = "force-dynamic";

const ROLE_LABEL = { attendee: "Member", organizer: "Organizer", admin: "Admin" } as const;

export default async function ProfilePage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/signin?next=/profile");

  return (
    <div className="mx-auto max-w-2xl animate-fade-up">
      <PageHero eyebrow="Account" title={<>Your <em>profile</em></>} />

      <div className="card mt-6 flex flex-wrap items-center gap-3 p-5">
        <span className="grid size-10 place-items-center rounded-xl bg-brand-soft text-brand-ink" aria-hidden>
          <Mail className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-semibold text-ink-subtle">Email (used to log in, can&apos;t be changed)</p>
          <p className="truncate text-[15px] font-semibold">{viewer.email}</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-canvas px-3 py-1.5 text-[12.5px] font-semibold text-ink-2">
          <BadgeCheck className="size-4 text-live" aria-hidden /> {ROLE_LABEL[viewer.role]}
        </span>
      </div>

      <ProfileForm name={viewer.name} phone={viewer.phone} whatsappOptIn={viewer.whatsappOptIn} />

      <p className="mt-4 text-[12.5px] text-ink-muted">
        {codeLoginOn()
          ? "You log in with a 6-digit code we email you each time."
          : "Logging in with an emailed 6-digit code is Planned. It switches on once the email service is set up."}{" "}
        Organizers never see your number. It&apos;s only used for WhatsApp reminders if you turn them on.
      </p>
    </div>
  );
}
