import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Mail, ScanFace } from "lucide-react";
import { getViewer } from "@/lib/rbac";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { ProfileFaceId } from "@/components/profile/ProfileFaceId";
import { PageHero } from "@/components/brand/PageHero";
import { BrandMark } from "@/components/site/Brand";
import { initials } from "@/lib/utils";

export const metadata: Metadata = { title: "Your profile" };
export const dynamic = "force-dynamic";

const ROLE_LABEL = { attendee: "Member", organizer: "Verified Organizer", admin: "Admin" } as const;

export default async function ProfilePage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/signin?next=/profile");

  return (
    <div className="pb-16">
      <PageHero
        title={
          <>
            Your <span className="text-[#D4B87A]">Profile.</span>
          </>
        }
      />

      <div className="mt-10 grid items-start gap-12 lg:grid-cols-[340px_minmax(0,1fr)] lg:gap-16">
        {/* Left: Sculpted Midnight-Charcoal Member Pass */}
        <aside className="space-y-8">
          <div className="overflow-hidden rounded-[8px] border border-[#2E3342] bg-[#1E212B] p-6 text-[#EFEAE0]">
            <div className="flex items-center justify-between border-b border-[#2E3342] pb-4">
              <div className="flex items-center gap-2.5">
                <BrandMark className="size-5" />
                <span className="font-display text-[20px] font-semibold italic text-[#D4B87A]">
                  EvntCult
                </span>
              </div>
              <span className="tr-meta text-[#D4B87A]">{ROLE_LABEL[viewer.role]}</span>
            </div>

            <div className="mt-6 flex items-center gap-4">
              <span
                className="grid size-14 shrink-0 place-items-center rounded-[6px] bg-[#D4B87A] font-display text-[22px] font-bold italic text-[#161820]"
                aria-hidden
              >
                {initials(viewer.name)}
              </span>
              <div className="min-w-0">
                <p className="truncate font-display text-[30px] font-semibold italic leading-none text-[#EFEAE0]">
                  {viewer.name}
                </p>
                <p className="mt-1.5 flex items-center gap-1.5 truncate font-mono text-[11.5px] text-[#9D978C]">
                  <Mail className="size-3 shrink-0" aria-hidden />
                  <span className="truncate">{viewer.email}</span>
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-dashed border-[#2E3342] pt-4">
              <span className="tr-meta text-[#9D978C]">Photo Vault</span>
              <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#EFEAE0]">
                <ScanFace className="size-3.5 text-[#D4B87A]" aria-hidden />
                {viewer.hasFaceId ? "Active" : "Not enrolled"}
              </span>
            </div>
          </div>

          <nav aria-label="Account sections" className="divide-y divide-line border-y border-line">
            {[
              { href: "/passes", label: "My Passes" },
              { href: "/vault", label: "Photo Vault" },
              { href: "/certificates", label: "Certificates" },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="group flex min-h-[52px] items-center justify-between font-display text-[24px] font-semibold italic text-ink transition-colors hover:text-[#D4B87A]"
              >
                <span>{label}</span>
                <ArrowRight className="size-4 text-[#D4B87A] transition-transform group-hover:translate-x-1" aria-hidden />
              </Link>
            ))}
          </nav>
        </aside>

        {/* Right: Editable Details & Face ID */}
        <div className="space-y-10">
          <ProfileForm name={viewer.name} phone={viewer.phone} whatsappOptIn={viewer.whatsappOptIn} />
          <ProfileFaceId initialHasFaceId={viewer.hasFaceId} initialUpdatedAt={viewer.faceUpdatedAt} />
        </div>
      </div>
    </div>
  );
}
