import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, ArrowUpRight, ShieldCheck } from "lucide-react";
import { getViewer } from "@/lib/rbac";
import { getDB } from "@/lib/db";
import { myCertificates } from "@/lib/data/certificates";
import { fmtDate } from "@/lib/utils";
import { PageHero } from "@/components/brand/PageHero";

export const metadata: Metadata = { title: "Certificates" };
export const dynamic = "force-dynamic";

export default async function CertificatesPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/signin?next=/certificates");
  const certs = await myCertificates(await getDB(), viewer.id);

  return (
    <div className="space-y-12 pb-16">
      <PageHero
        title={
          <>
            Verified <span className="text-[#D4B87A]">Certificates.</span>
          </>
        }
        actions={
          <span className="tr-meta text-ink-muted">
            {certs.length} {certs.length === 1 ? "record" : "records"}
          </span>
        }
      />

      {certs.length === 0 ? (
        <section className="grid items-center gap-10 rounded-[6px] border border-line bg-surface p-8 md:grid-cols-[1.1fr_0.9fr] md:p-12">
          <div>
            <h2 className="font-display text-[clamp(32px,4vw,52px)] font-bold italic leading-[0.95] text-ink">
              No certificates yet.
            </h2>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/events?type=WORKSHOP"
                className="group inline-flex h-12 items-center gap-2 rounded-[4px] bg-[#D4B87A] px-7 text-[11px] font-medium uppercase tracking-[0.14em] text-[#161820] transition-colors hover:bg-[#E0C78E]"
              >
                <span>Workshops</span>
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </Link>
              <Link
                href="/events?type=TECH"
                className="inline-flex h-12 items-center rounded-[4px] border border-line-strong px-6 text-[11px] font-medium uppercase tracking-[0.14em] text-ink transition-colors hover:border-[#D4B87A] hover:text-[#D4B87A]"
              >
                Hackathons
              </Link>
            </div>
          </div>

          <div className="tr-paper mx-auto w-full max-w-[340px] rounded-[4px] border border-[#D4B87A]/40 bg-[#EFEAE0] p-3">
            <div className="border border-dashed border-[#161820]/25 px-6 py-8 text-center text-[#161820]">
              <span className="tr-meta inline-flex items-center gap-1.5 text-[#161820]/70">
                <ShieldCheck className="size-3.5 text-[#161820]" aria-hidden />
                Verified by EvntCult
              </span>
              <p className="mt-5 font-display text-[32px] font-bold italic leading-none text-[#161820]">
                {viewer.name}
              </p>
            </div>
          </div>
        </section>
      ) : (
        <ul className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {certs.map((c) => (
            <li key={c.id}>
              <Link
                href={`/certificates/${c.id}`}
                className="group flex h-full flex-col overflow-hidden rounded-[6px] border border-line bg-surface transition-colors hover:border-[#D4B87A]/60"
              >
                <div className="tr-paper border-b border-line bg-[#EFEAE0] p-3">
                  <div className="flex min-h-[150px] flex-col items-center justify-center border border-dashed border-[#161820]/25 px-5 py-6 text-center text-[#161820]">
                    <span className="tr-meta text-[#161820]/65">
                      {c.kind === "participation" ? "Attendance" : c.kind}
                    </span>
                    <p className="mt-2.5 line-clamp-2 font-display text-[26px] font-bold italic leading-[1.06] text-[#161820]">
                      {c.eventTitle}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 p-5">
                  <p className="tr-meta truncate text-ink-muted">
                    {fmtDate(new Date(c.startsAt), { day: "numeric", month: "short", year: "numeric" })}
                    {c.venue ? ` · ${c.venue}` : ""}
                  </p>
                  <ArrowUpRight className="size-4 shrink-0 text-[#D4B87A] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
