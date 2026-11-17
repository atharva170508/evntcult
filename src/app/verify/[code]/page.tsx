import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getDB } from "@/lib/db";
import { getViewer } from "@/lib/rbac";
import { requireTermsAccepted } from "@/lib/terms-gate";
import { verifyCertificate, type CertKind } from "@/lib/data/certificates";
import { BadgeCheck, XCircle } from "lucide-react";
import { LogoWordmark } from "@/components/brand/MissingE";

export const metadata: Metadata = { title: { absolute: "Verify certificate" }, robots: { index: false } };
export const dynamic = "force-dynamic";

const KIND: Record<CertKind, string> = { participation: "Participation", winner: "Winner", volunteer: "Volunteer", speaker: "Speaker" };
const date = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", day: "numeric", month: "long", year: "numeric" });

/** Certificate check: shows the holder's name, so it's for signed-in people only. No app navigation; made to be screenshotted. */
export default async function VerifyPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const viewer = await getViewer();
  if (!viewer) redirect(`/signin?next=/verify/${encodeURIComponent(code)}`);
  await requireTermsAccepted(viewer);
  const c = await verifyCertificate(await getDB(), decodeURIComponent(code));

  return (
    <main id="main" className="relative isolate grid min-h-dvh place-items-center px-5 py-12">
      <div aria-hidden className="dot-grid absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,black,transparent_75%)]" />
      <div className="w-full max-w-xl">
        <div className="mb-8 flex justify-center">
          <LogoWordmark motion="still" className="text-[24px] text-ink" />
        </div>
        {!c ? (
          <div className="card flex flex-col items-center p-10 text-center">
            <span className="grid size-12 place-items-center rounded-full bg-danger-soft text-danger">
              <XCircle className="size-6" aria-hidden />
            </span>
            <h1 className="mt-5 text-h3 font-semibold">No certificate matches this code</h1>
            <p className="mt-2 font-mono text-[13px] text-ink-muted">{code.toUpperCase()}</p>
          </div>
        ) : (
          <article className="card overflow-hidden">
            <div className={c.revokedAt ? "flex items-center gap-2.5 bg-danger px-6 py-4 text-white" : "flex items-center gap-2.5 bg-night px-6 py-4 text-white"}>
              {c.revokedAt ? <XCircle className="size-5" aria-hidden /> : <BadgeCheck className="size-5 text-[#6EE3A6]" aria-hidden />}
              <p className="text-[15px] font-medium" role={c.revokedAt ? "alert" : "status"}>
                {c.revokedAt ? `Revoked on ${date.format(new Date(c.revokedAt))}` : "Verified certificate"}
              </p>
              <span className="ml-auto font-mono text-[11.5px] tracking-[0.1em] text-white/60">{code.toUpperCase()}</span>
            </div>
            <div className="p-6 md:p-8">
              <p className="eyebrow">{KIND[c.kind]} certificate</p>
              <h1 className="mt-3 text-display-md font-semibold">{c.name}</h1>
              <p className="mt-2 text-lead text-ink-2">{c.eventTitle}</p>
              <dl className="mt-8 divide-y divide-line border-y border-line text-[15px]">
                {[
                  ["Type", KIND[c.kind]],
                  ["Issued", date.format(new Date(c.issuedAt))],
                  ["Organizer", c.organizerName],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 py-3.5">
                    <dt className="text-ink-muted">{k}</dt>
                    <dd className="text-right font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-6 text-[13px] text-ink-muted">Issued by EvntCult for attendance at this event.</p>
            </div>
          </article>
        )}
      </div>
    </main>
  );
}
