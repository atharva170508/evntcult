import type { Metadata } from "next";
import { getDB } from "@/lib/db";
import { verifyCertificate, type CertKind } from "@/lib/data/certificates";

export const metadata: Metadata = { title: { absolute: "Verify certificate" }, robots: { index: false } };
export const dynamic = "force-dynamic";

const KIND: Record<CertKind, string> = { participation: "Participation", winner: "Winner", volunteer: "Volunteer", speaker: "Speaker" };
const date = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", day: "numeric", month: "long", year: "numeric" });

/** Public, no account and no app navigation. Made to be screenshotted. */
export default async function VerifyPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const c = await verifyCertificate(await getDB(), decodeURIComponent(code));

  return (
    <main id="main" tabIndex={-1} className="mx-auto grid min-h-dvh max-w-xl place-items-center px-6 py-12">
      {!c ? (
        <div className="w-full">
          <p className="eyebrow">{code.toUpperCase()}</p>
          <h1 className="title-xl mt-2">No certificate matches this code.</h1>
          <p className="mt-2 text-body text-ink-muted">Check the code on the certificate. Codes are 8 letters and numbers.</p>
        </div>
      ) : (
        <div className="w-full">
          {c.revokedAt && (
            <p role="alert" className="mb-6 border-l-2 border-bad py-1 pl-3 text-body font-semibold">
              This certificate was revoked on {date.format(new Date(c.revokedAt))}.
            </p>
          )}
          <p className="eyebrow">{code.toUpperCase()}</p>
          <h1 className="title-xl mt-2">{c.name}</h1>
          <p className="mt-2 text-title">{c.eventTitle}</p>
          <dl className="mt-8 divide-y divide-line border-y border-line text-body">
            {[
              ["Status", c.revokedAt ? `Revoked on ${date.format(new Date(c.revokedAt))}` : "Valid"],
              ["Type", KIND[c.kind]],
              ["Issued", date.format(new Date(c.issuedAt))],
              ["Organizer", c.organizerName],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 py-3">
                <dt className="text-ink-muted">{k}</dt>
                <dd className="text-right font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-6 text-body text-ink-muted">This certificate was issued by EvntCult for attendance at this event.</p>
        </div>
      )}
    </main>
  );
}
