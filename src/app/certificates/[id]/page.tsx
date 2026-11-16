import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import QRCode from "qrcode";
import { getDB } from "@/lib/db";
import { getViewer } from "@/lib/rbac";
import { certificateFor, type CertKind } from "@/lib/data/certificates";
import { siteHost } from "@/lib/organizer/page-data";
import { slugify } from "@/lib/organizer/shared";
import { PrintButton } from "@/components/certificates/PrintButton";
import "./certificate.css";

export const dynamic = "force-dynamic";

const HEADING: Record<CertKind, string> = { participation: "Certificate of participation", winner: "Certificate of achievement", volunteer: "Certificate of service", speaker: "Certificate of appreciation" };
const VERB: Record<CertKind, string> = { participation: "attended", winner: "won at", volunteer: "volunteered at", speaker: "spoke at" };
const longDate = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", weekday: "long", day: "numeric", month: "long", year: "numeric" });

type Props = { params: Promise<{ id: string }> };

/** The browser uses the page title as the PDF's file name. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [{ id }, viewer] = await Promise.all([params, getViewer()]);
  const c = viewer ? await certificateFor(await getDB(), id, viewer) : null;
  return { title: { absolute: c ? `${c.eventSlug}-${slugify(c.name)}` : "Certificate" }, robots: { index: false } };
}

export default async function CertificatePage({ params }: Props) {
  const [{ id }, viewer, host] = await Promise.all([params, getViewer(), siteHost()]);
  if (!viewer) redirect(`/signin?next=/certificates/${encodeURIComponent(id)}`);
  const c = await certificateFor(await getDB(), id, viewer);
  if (!c) notFound();

  const scheme = host.startsWith("localhost") ? "http" : "https";
  const qr = await QRCode.toString(`${scheme}://${host}/verify/${c.publicCode}`, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#111111", light: "#f7f6f2" } });

  return (
    <main className="cert-page">
      <div className="cert-actions">
        <PrintButton />
      </div>
      <div className="cert-frame">
        <article className="cert" aria-label={HEADING[c.kind]}>
          <p className="cert-brand">EVNTCULT</p>
          <p className="cert-kind">{HEADING[c.kind]}</p>
          <h1 className="cert-name">{c.name}</h1>
          <p className="cert-verb">{VERB[c.kind]}</p>
          <p className="cert-event">{c.eventTitle}</p>
          <div className="cert-rule" />
          <p className="cert-when">
            on {longDate.format(new Date(c.startsAt))}
            {c.venue ? `, at ${c.venue}` : ""}
          </p>
          <div className="cert-foot">
            <div>
              <div className="cert-sign" />
              <p className="cert-org">{c.organizerName}, Organizer</p>
            </div>
            <div className="cert-check">
              <div className="cert-qr" dangerouslySetInnerHTML={{ __html: qr }} />
              <div>
                <p className="cert-code">{c.publicCode}</p>
                <p className="cert-at">
                  verify at
                  <br />
                  {host}/verify
                </p>
              </div>
            </div>
          </div>
        </article>
      </div>
    </main>
  );
}
