import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Award, BadgeCheck, ChevronRight, Images, Mail, ScanFace, Ticket } from "lucide-react";
import { getViewer } from "@/lib/rbac";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { ProfileFaceId } from "@/components/profile/ProfileFaceId";
import { BrandMark } from "@/components/site/Brand";
import { BorderTrail } from "@/components/shadcn/border-trail";
import { GlowEffect } from "@/components/shadcn/glow-effect";
import { initials } from "@/lib/utils";

export const metadata: Metadata = { title: "Your profile" };
export const dynamic = "force-dynamic";

const ROLE_LABEL = { attendee: "Campus Member", organizer: "Verified Organizer", admin: "Admin" } as const;

export default async function ProfilePage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/signin?next=/profile");

  const barcode = [2, 1, 3, 1, 2, 1, 1, 3, 2, 1, 2, 3, 1, 2, 1, 3, 1, 2];

  return (
    <div className="pb-14">
      <header className="border-b border-line pb-6 pt-8 md:pt-10">
        <h1 className="font-display text-[clamp(40px,5vw,60px)] leading-[0.95] tracking-[-0.03em] text-ink">
          Your <em>identity.</em>
        </h1>
        <p className="mt-2 text-[15px] text-ink-muted">
          Manage your pass name, WhatsApp reminders, and Face ID for automatic event photos.
        </p>
      </header>

      <div className="mt-10 grid items-start gap-10 lg:grid-cols-[340px_minmax(0,1fr)] lg:gap-14">
        {/* Left: Physical Obsidian Campus Member ID Card + Quick Links */}
        <aside className="space-y-6">
          <div className="relative">
            <GlowEffect
              colors={["#E3264F", "#F0D7FF", "#5D3827", "#E3264F"]}
              mode="breathe"
              blur="strong"
              className="pointer-events-none -inset-0.5 rounded-[26px] opacity-25"
            />
          <div className="relative overflow-hidden rounded-[24px] bg-[#141312] p-6 text-[#FFFEF6] shadow-[0_30px_60px_-28px_rgba(20,14,6,0.65)] ring-1 ring-white/10">
            <BorderTrail
              size={64}
              className="bg-gradient-to-l from-[#F0D7FF] via-[#E3264F] to-transparent opacity-70"
              transition={{ repeat: Infinity, duration: 6.5, ease: "linear" }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-[#E3264F]/20 blur-[60px]"
            />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BrandMark tone="white" className="h-5 w-6" />
                <span className="font-mono text-[11px] font-medium tracking-[0.06em] text-[#FFFEF6]/75">
                  EVNTCULT ID
                </span>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 text-[11.5px] font-semibold text-[#FFFEF6]">
                <BadgeCheck className="size-3.5 text-[#5EE0A8]" aria-hidden />
                {ROLE_LABEL[viewer.role]}
              </span>
            </div>

            <div className="relative mt-6 flex items-center gap-4">
              <span
                className="grid size-14 shrink-0 place-items-center rounded-2xl bg-[#F0D7FF] font-sans text-[18px] font-extrabold text-[#141312]"
                aria-hidden
              >
                {initials(viewer.name)}
              </span>
              <div className="min-w-0">
                <p className="truncate font-display text-[28px] leading-none text-[#FFFEF6]">
                  {viewer.name}
                </p>
                <p className="mt-1.5 flex items-center gap-1.5 truncate text-[12.5px] text-[#FFFEF6]/70">
                  <Mail className="size-3.5 shrink-0" aria-hidden />
                  <span className="truncate">{viewer.email}</span>
                </p>
              </div>
            </div>

            <div className="relative my-5 border-t border-dashed border-white/15" />

            <div className="relative flex items-end justify-between gap-3">
              <div>
                <p className="text-[11px] font-medium text-[#FFFEF6]/55">Photo Vault Face ID</p>
                <p className="mt-0.5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#FFFEF6]">
                  <ScanFace className="size-3.5 text-[#F0D7FF]" aria-hidden />
                  {viewer.hasFaceId ? "Active & enrolled" : "Not enrolled yet"}
                </p>
              </div>
              <div aria-hidden className="flex h-6 items-stretch gap-[2px] opacity-65">
                {barcode.map((w, idx) => (
                  <span key={idx} className="rounded-[0.5px] bg-[#FFFEF6]" style={{ width: `${w}px` }} />
                ))}
              </div>
            </div>
          </div>
          </div>

          <p className="text-[12.5px] leading-relaxed text-ink-muted">
            Your login email (<span className="font-medium text-ink">{viewer.email}</span>) is permanently linked to your passes and certificates.
          </p>

          <nav aria-label="Account sections" className="divide-y divide-line border-t border-line">
            {[
              { href: "/passes", label: "My passes", icon: Ticket },
              { href: "/vault", label: "Photo Vault", icon: Images },
              { href: "/certificates", label: "Certificates", icon: Award },
            ].map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="group flex items-center justify-between py-3.5 text-[14.5px] font-semibold text-ink transition-colors hover:text-ink"
              >
                <span className="flex items-center gap-3">
                  <Icon className="size-4 text-ink-muted group-hover:text-ink" aria-hidden />
                  {label}
                </span>
                <ChevronRight className="size-4 text-ink-muted transition-transform group-hover:translate-x-0.5 group-hover:text-ink" aria-hidden />
              </Link>
            ))}
          </nav>
        </aside>

        {/* Right: Editable Details & Face ID Studio */}
        <div className="space-y-8">
          <ProfileForm name={viewer.name} phone={viewer.phone} whatsappOptIn={viewer.whatsappOptIn} />
          <ProfileFaceId initialHasFaceId={viewer.hasFaceId} initialUpdatedAt={viewer.faceUpdatedAt} />
        </div>
      </div>
    </div>
  );
}
