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
    <div className="space-y-5">
      <PageHero
        eyebrow="Certificates"
        title={<>Proof you were <em>there</em></>}
        sub={`${certs.length} certificate${certs.length === 1 ? "" : "s"}`}
      />
      {certs.length === 0 ? (
        <EmptyState icon={Award} title="No certificates yet" action={{ label: "Find an event", href: "/events" }} />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {certs.map((c) => (
            <li key={c.id}>
              <Link href={`/certificates/${c.id}`} className="card group flex items-center gap-4 p-5 transition-colors hover:border-volt/60">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-volt/10 text-volt" aria-hidden>
                  <Award className="size-6" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[16px] font-bold">{c.eventTitle}</p>
                  <p className="text-[13px] text-ink-muted">{fmtDate(new Date(c.startsAt), { day: "numeric", month: "short", year: "numeric" })} {c.venue ? ` · ${c.venue}` : ""}{c.kind !== "participation" ? ` · ${c.kind}` : ""}</p>
                </div>
                <ArrowUpRight className="size-4 text-ink-subtle group-hover:text-volt" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
