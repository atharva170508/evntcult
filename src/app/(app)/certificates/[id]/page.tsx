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
    <div className="space-y-5 pt-4">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href="/certificates" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-muted hover:text-volt">
          <ArrowLeft className="size-4" aria-hidden /> All certificates
        </Link>
        <PrintButton />
      </div>

      <article
        aria-label="Certificate of attendance"
        className="relative mx-auto max-w-3xl overflow-hidden rounded-[32px] border border-white/10 bg-surface p-8 text-center md:p-14 print:max-w-none print:rounded-none print:border-[3px] print:border-black print:bg-white print:text-black"
      >
        <div className="absolute inset-x-0 top-0 h-2 bg-volt print:bg-black" aria-hidden />
        <div className="flex items-center justify-center gap-2.5">
          <LogoWordmark motion="still" className="text-[32px] text-ink print:text-black" />
        </div>
        <p className="mt-10 text-[12.5px] font-bold uppercase tracking-[0.22em] text-volt print:text-black">Certificate of attendance</p>
        <p className="mt-6 text-[15px] text-ink-muted print:text-black">This certifies that</p>
        <p className="mt-2 font-display text-[clamp(36px,6vw,64px)] font-bold leading-tight tracking-[-0.03em]">{c.name}</p>
        <p className="mt-4 text-[15px] text-ink-muted print:text-black">attended</p>
        <p className="mt-2 font-display text-[clamp(24px,3.6vw,36px)] font-semibold leading-tight tracking-[-0.02em]">{c.eventTitle}</p>
        <p className="mt-3 text-[15px] text-ink-2 print:text-black">
          {fmtDate(start, { weekday: "long", day: "numeric", month: "long", year: "numeric" })} · {c.venue}
        </p>
        <p className="mt-1 text-[13px] text-ink-muted print:text-black">
          Checked in at the gate at {fmtTime(new Date(c.checkedInAt))}, {fmtDate(new Date(c.checkedInAt), { day: "numeric", month: "short" })}
        </p>

        <div className="mt-12 grid gap-6 border-t border-line pt-6 text-left sm:grid-cols-2 print:border-black">
          <div>
            <p className="text-[11.5px] font-bold uppercase tracking-[0.12em] text-ink-subtle print:text-black">Organized by</p>
            <p className="mt-1 text-[15px] font-semibold">{c.organizerName}</p>
          </div>
          <div className="sm:text-right">
            <p className="text-[11.5px] font-bold uppercase tracking-[0.12em] text-ink-subtle print:text-black">Certificate ID</p>
            <p className="mt-1 break-all font-mono text-[12.5px]">{c.id}</p>
          </div>
        </div>
      </article>
    </div>
  );
}
