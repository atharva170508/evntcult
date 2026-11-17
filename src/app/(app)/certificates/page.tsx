import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight, Award } from "lucide-react";
import { getViewer } from "@/lib/rbac";
import { getDB } from "@/lib/db";
import { myCertificates } from "@/lib/data/certificates";
import { fmtDate } from "@/lib/utils";
import { PageHero } from "@/components/brand/PageHero";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata: Metadata = { title: "Certificates" };
export const dynamic = "force-dynamic";

export default async function CertificatesPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/signin?next=/certificates");
  const certs = await myCertificates(await getDB(), viewer.id);

  return (
    <div className="space-y-10 pb-8">
      <PageHero
        eyebrow="Certificates"
        title={
          <>
            Proof you were <em>there.</em>
          </>
        }
        sub={
          <>
            <span className="font-mono tabular-nums text-ink">{certs.length}</span> certificate{certs.length === 1 ? "" : "s"}
          </>
        }
      />
      {certs.length === 0 ? (
        <EmptyState icon={Award} title="No certificates yet" action={{ label: "Find an event", href: "/events" }} />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {certs.map((c) => (
            <li key={c.id}>
              <Link href={`/certificates/${c.id}`} className="card card-hover group flex h-full flex-col overflow-hidden">
                {/* Miniature certificate */}
                <div className="relative border-b border-line bg-[linear-gradient(180deg,#FFFFFF,#FAF9F6)] px-6 pb-6 pt-8 text-center">
                  <span className="absolute inset-x-0 top-0 h-1 bg-night" aria-hidden />
                  <p className="eyebrow">Certificate of attendance</p>
                  <p className="mt-3 line-clamp-2 text-h3 font-semibold">{c.eventTitle}</p>
                </div>
                <div className="flex items-center gap-3 p-5">
                  <Award className="size-5 shrink-0 text-ink-subtle" aria-hidden />
                  <p className="min-w-0 flex-1 truncate text-[13px] text-ink-muted">
                    <span className="font-mono">{fmtDate(new Date(c.startsAt), { day: "numeric", month: "short", year: "numeric" })}</span>
                    {c.venue ? ` · ${c.venue}` : ""}
                    {c.kind !== "participation" ? ` · ${c.kind}` : ""}
                  </p>
                  <ArrowUpRight className="size-4 shrink-0 text-ink-subtle transition-transform duration-base ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink" aria-hidden />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
