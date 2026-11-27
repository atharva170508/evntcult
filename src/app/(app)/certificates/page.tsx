import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight, Award, ShieldCheck } from "lucide-react";
import { getViewer } from "@/lib/rbac";
import { getDB } from "@/lib/db";
import { myCertificates } from "@/lib/data/certificates";
import { fmtDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Certificates" };
export const dynamic = "force-dynamic";

export default async function CertificatesPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/signin?next=/certificates");
  const certs = await myCertificates(await getDB(), viewer.id);

  return (
    <div className="space-y-10 pb-14">
      <header className="flex flex-col gap-4 border-b border-line pb-7 pt-8 sm:flex-row sm:items-end sm:justify-between md:pt-10">
        <div>
          <h1 className="font-display text-[clamp(40px,5vw,64px)] leading-[0.95] tracking-[-0.03em] text-ink">
            Verified <em>credentials.</em>
          </h1>
          <p className="mt-2.5 text-[15px] text-ink-muted">
            Every certificate issued by a campus organizer comes with a permanent verification link.
          </p>
        </div>
        <p className="font-mono text-[13px] font-semibold tabular-nums text-ink-muted">
          {certs.length} {certs.length === 1 ? "certificate" : "certificates"}
        </p>
      </header>

      {certs.length === 0 ? (
        <section className="grid items-center gap-8 rounded-[28px] border border-line-strong bg-sunken/75 p-7 sm:p-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <h2 className="font-display text-[clamp(30px,3.6vw,44px)] leading-[1.02] tracking-[-0.025em] text-ink">
              No certificates earned yet.
            </h2>
            <p className="mt-3 max-w-[46ch] text-[15px] leading-relaxed text-ink-2">
              Attend workshops, hackathons, or talks that issue participation records. Once checked in, your signed certificate lands here automatically, ready to share on LinkedIn or your resume.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-4">
              <Link
                href="/events?type=WORKSHOP"
                className="ui-press ui-sheen inline-flex h-12 items-center gap-2 rounded-xl bg-lavender px-6 text-[15px] font-semibold text-ink shadow-button ring-2 ring-inset ring-ink hover:bg-lavender-hover"
              >
                <Award className="size-4" aria-hidden />
                Find a workshop
              </Link>
              <Link
                href="/events?type=TECH"
                className="text-[14.5px] font-semibold text-ink underline decoration-line-strong decoration-2 underline-offset-[6px] hover:decoration-ink"
              >
                Explore hackathons
              </Link>
            </div>
          </div>

          {/* Stationery diploma preview */}
          <div className="paper-keep mx-auto w-full max-w-[340px] rounded-[20px] border border-[#D8D1BE] bg-[#FFFEF6] p-3 shadow-card">
            <div className="rounded-[14px] border border-dashed border-[#D8D1BE] px-5 py-6 text-center text-[#1A1A1A]">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F0D7FF] px-3 py-1 text-[11px] font-semibold text-[#1A1A1A]">
                <ShieldCheck className="size-3.5" aria-hidden />
                Verified by EvntCult
              </span>
              <p className="mt-4 font-display text-[26px] leading-tight text-[#1A1A1A]">
                {viewer.name}
              </p>
              <p className="mt-1 text-[12.5px] text-[#6A6A6A]">
                Certificate of participation · Permanent verify URL
              </p>
            </div>
          </div>
        </section>
      ) : (
        <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {certs.map((c) => (
            <li key={c.id}>
              <Link
                href={`/certificates/${c.id}`}
                className="group flex h-full flex-col overflow-hidden rounded-[22px] border border-line-strong bg-surface shadow-card transition-[transform,box-shadow] duration-fast hover:-translate-y-0.5 hover:shadow-raised"
              >
                {/* Stationery miniature diploma */}
                <div className="paper-keep relative border-b border-line bg-[#FFFEF6] p-3">
                  <div className="flex min-h-[146px] flex-col items-center justify-center rounded-[14px] border border-dashed border-[#D8D1BE] px-5 py-6 text-center">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-accent-ink">
                      <ShieldCheck className="size-3.5" aria-hidden />
                      {c.kind === "participation" ? "Certificate of attendance" : c.kind}
                    </span>
                    <p className="mt-2.5 line-clamp-2 font-display text-[24px] leading-[1.08] tracking-[-0.02em] text-[#1A1A1A]">
                      {c.eventTitle}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-5">
                  <Award className="size-4 shrink-0 text-ink-muted" aria-hidden />
                  <p className="min-w-0 flex-1 truncate text-[13.5px] text-ink-muted">
                    <span className="font-mono text-ink">
                      {fmtDate(new Date(c.startsAt), { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                    {c.venue ? ` · ${c.venue}` : ""}
                  </p>
                  <ArrowUpRight
                    className="size-4 shrink-0 text-ink-subtle transition-transform duration-base ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink"
                    aria-hidden
                  />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
