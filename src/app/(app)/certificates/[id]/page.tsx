import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getViewer } from "@/lib/rbac";
import { getDB } from "@/lib/db";
import { certificateFor } from "@/lib/data/certificates";
import { fmtDate, fmtTime } from "@/lib/utils";
import { LogoWordmark } from "@/components/brand/MissingE";
import { PrintButton } from "@/components/certificates/PrintButton";

export const metadata: Metadata = { title: "Certificate of attendance" };
export const dynamic = "force-dynamic";

export default async function CertificatePage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, viewer] = await Promise.all([params, getViewer()]);
  if (!viewer) redirect(`/signin?next=/certificates/${encodeURIComponent(id)}`);
  const c = await certificateFor(await getDB(), id, viewer);
  if (!c) notFound();
  const start = new Date(c.startsAt);

  return (
    <div className="space-y-8 pb-8 pt-6 md:pt-8">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href="/certificates" className="group inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-muted transition-colors hover:text-ink">
          <ArrowLeft className="size-4 transition-transform duration-base ease-out group-hover:-translate-x-0.5" aria-hidden /> All certificates
        </Link>
        <PrintButton />
      </div>

      <article
        aria-label="Certificate of attendance"
        className="relative mx-auto max-w-3xl overflow-hidden rounded-panel bg-surface px-8 py-12 text-center shadow-raised md:px-16 md:py-16 print:max-w-none print:rounded-none print:shadow-none print:ring-[3px] print:ring-black"
      >
        <div className="pointer-events-none absolute inset-3 rounded-[20px] border border-line md:inset-4 print:border-black" aria-hidden />
        <LogoWordmark motion="still" className="text-[30px] text-ink print:text-black" />
        <p className="eyebrow mt-12 tracking-[0.24em] print:text-black">Certificate of attendance</p>
        <p className="mt-8 font-serif text-[20px] italic text-ink-muted print:text-black">This certifies that</p>
        <p className="mt-3 text-display-lg font-semibold">{c.name}</p>
        <p className="mt-5 font-serif text-[20px] italic text-ink-muted print:text-black">attended</p>
        <p className="mt-3 text-display-md font-semibold">{c.eventTitle}</p>
        <p className="mt-4 text-[15px] text-ink-2 print:text-black">
          {fmtDate(start, { weekday: "long", day: "numeric", month: "long", year: "numeric" })} · {c.venue}
        </p>
        <p className="mt-1 text-[13px] text-ink-muted print:text-black">
          Checked in at the gate at <span className="font-mono">{fmtTime(new Date(c.checkedInAt))}</span>, {fmtDate(new Date(c.checkedInAt), { day: "numeric", month: "short" })}
        </p>

        <dl className="mt-14 grid gap-6 border-t border-line pt-6 text-left sm:grid-cols-2 print:border-black">
          <div>
            <dt className="eyebrow print:text-black">Organized by</dt>
            <dd className="mt-1.5 text-[15px] font-medium">{c.organizerName}</dd>
          </div>
          <div className="sm:text-right">
            <dt className="eyebrow print:text-black">Certificate ID</dt>
            <dd className="mt-1.5 break-all font-mono text-[12.5px] text-ink-2">{c.id}</dd>
          </div>
        </dl>
      </article>
    </div>
  );
}
