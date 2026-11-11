import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
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
    <div className="flex flex-col gap-8">
      <PageHero
        eyebrow="Certificates"
        title="Proof you were there"
        sub={`${certs.length} certificate${certs.length === 1 ? "" : "s"}`}
      />
      {certs.length === 0 ? (
        <EmptyState title="No certificates yet." body="You get one for every event where your pass is scanned at the gate." action={{ label: "Find an event", href: "/events" }} />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {certs.map((c) => (
            <li key={c.id}>
              <Link href={`/certificates/${c.id}`} className="card lift flex items-center gap-4 p-4 sm:p-6">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-body font-semibold">{c.eventTitle}</p>
                  <p className="font-mono text-label text-ink-muted">{fmtDate(new Date(c.startsAt), { day: "numeric", month: "short", year: "numeric" })} {c.venue ? ` · ${c.venue}` : ""}{c.kind !== "participation" ? ` · ${c.kind}` : ""}</p>
                </div>
                <span aria-hidden className="text-ink-subtle">
                  ›
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
