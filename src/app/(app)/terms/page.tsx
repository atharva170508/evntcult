import type { Metadata } from "next";
import { getViewer } from "@/lib/rbac";
import { TERMS_VERSION } from "@/lib/terms";
import { PageHero } from "@/components/brand/PageHero";
import { AcceptTerms } from "@/components/terms/AcceptTerms";

export const metadata: Metadata = { title: "Terms & Conditions" };
export const dynamic = "force-dynamic";

const version = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${TERMS_VERSION}T00:00:00Z`));

/** One section of the terms. `id` is the anchor used by the contents list. */
const SECTIONS: { id: string; title: string; body: React.ReactNode }[] = [
  {
    id: "about",
    title: "About these terms",
    body: (
      <>
        <p>
          EvntCult is a campus events app built and run by <b>Synchronous Labs</b>, a student development group. These Terms &amp; Conditions and User Rules apply to everyone who uses
          EvntCult: students who browse and register, organizers who host events, and anyone scanning passes at a gate.
        </p>
        <p>By creating an account or using EvntCult, you agree to them. If you don&apos;t agree, please don&apos;t use EvntCult.</p>
      </>
    ),
  },
  {
    id: "what-we-do",
    title: "What EvntCult does, and doesn't do",
    body: (
      <>
        <p>EvntCult is a tool. It lists events, lets you register, gives you a pass, and helps organizers check people in, share updates, photos and certificates.</p>
        <p>
          <b>Events are run by their organizers</b> (clubs, societies and students), not by EvntCult or Synchronous Labs. The organizer is responsible for the event itself: what
          happens there, its timing, venue, safety, pricing, refunds and any changes or cancellations.
        </p>
      </>
    ),
  },
  {
    id: "payments",
    title: "Payments, tickets and third parties",
    body: (
      <>
        <p>
          When an event is paid, you pay the organizer directly (for example by UPI, or at the desk). EvntCult does not collect, hold, transfer or refund money. Organizers confirm
          payments themselves.
        </p>
        <p className="rounded-xl bg-sunken px-4 py-3 font-medium text-ink">
          Synchronous Labs and the EvntCult developers are not responsible or liable for anything that happens during payments, ticket transactions or interactions with third
          parties. This includes failed, delayed, duplicate or wrong payments; refunds or the lack of them; disputes with organizers; fraud by anyone; and problems caused by
          banks, UPI apps, email, WhatsApp, Google or any other outside service.
        </p>
        <p>If something goes wrong with a payment, contact the organizer of that event first. Keep your payment reference (UTR) until the event is over.</p>
      </>
    ),
  },
  {
    id: "liability",
    title: "Events and limits of liability",
    body: (
      <>
        <p>
          EvntCult is provided as it is, without any promise that it will always be available, error-free or accurate. Event details come from organizers and can change.
        </p>
        <p>
          To the fullest extent the law allows, Synchronous Labs and the EvntCult developers are not liable for any loss, injury, damage, cost or claim connected with an event,
          an organizer, another user, a payment, a pass, or your use of EvntCult. You attend events at your own risk and under your college&apos;s rules.
        </p>
      </>
    ),
  },
  {
    id: "account",
    title: "Your account",
    body: (
      <ul>
        <li>Use your real name and an email and mobile number you control. One account per person.</li>
        <li>Keep your email account secure: the login codes we send are how you get in.</li>
        <li>Your pass is yours. Don&apos;t share, sell or copy it.</li>
        <li>We may block an account that breaks these terms or the User Rules, or that puts other people at risk.</li>
      </ul>
    ),
  },
  {
    id: "rules",
    title: "User Rules",
    body: (
      <>
        <p>For everyone, on the app and at events:</p>
        <ul>
          <li>Treat people with respect. No harassment, bullying, threats, hate or discrimination, in person or online.</li>
          <li>Follow your college&apos;s rules and the organizer&apos;s and volunteers&apos; instructions at every event.</li>
          <li>Carry your college ID if the event or venue asks for it.</li>
          <li>Never bring alcohol, drugs, weapons or anything else your college or the venue doesn&apos;t allow.</li>
          <li>Only use your own pass. Don&apos;t forge, edit, resell or screenshot-share passes to get someone else in.</li>
          <li>Ask before taking or sharing photos of people. If you see a photo of yourself you don&apos;t want up, tell the organizer.</li>
          <li>Look after the venue. You&apos;re responsible for damage you cause.</li>
          <li>Don&apos;t misuse EvntCult: no fake accounts, spam, scraping, trying to break in, or getting around limits.</li>
        </ul>
        <p>For organizers, as well:</p>
        <ul>
          <li>Hosting is for approved organizers. Post only real events your club or group is running, with accurate dates, venue, price and seats.</li>
          <li>Be clear about payment, refunds and what&apos;s included before people register, and keep the promises you make.</li>
          <li>Tell attendees quickly about changes and cancellations, using EvntCult&apos;s updates.</li>
          <li>Use attendee details only to run your event. Don&apos;t share or sell them.</li>
          <li>Have the permissions your college needs for your event and venue.</li>
        </ul>
      </>
    ),
  },
  {
    id: "information",
    title: "Your information",
    body: (
      <p>
        We use your name, email and mobile number to run your account, your passes and event updates. Organizers see the names of people registered for their own events so they can
        run them. Event photos are visible only to people registered for that event and its organizer.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to these terms",
    body: <p>We may update these terms. When we make a change you should agree to, we&apos;ll ask you to accept the new version the next time you open EvntCult.</p>,
  },
  {
    id: "contact",
    title: "Contact",
    body: (
      <p>
        Questions, problems or something to report: write to{" "}
        <a href="mailto:evntcult@gmail.com" className="font-semibold text-ink underline decoration-line-strong underline-offset-[3px] hover:decoration-ink">
          evntcult@gmail.com
        </a>
        .
      </p>
    ),
  },
];

/** Terms & Conditions and User Rules. Open to everyone; signed-in people who haven't accepted yet see the accept panel first. */
export default async function TermsPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const [viewer, { next }] = await Promise.all([getViewer(), searchParams]);
  const back = next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/terms") ? next : "/dashboard";

  return (
    <div className="pb-12">
      <PageHero title="Terms & Conditions" sub={`Terms & Conditions and User Rules · version of ${version}`} />

      {viewer && !viewer.termsAccepted && (
        <div className="mb-10 max-w-[760px]">
          <AcceptTerms next={back} />
        </div>
      )}

      <div id="terms" className="grid scroll-mt-28 gap-10 lg:grid-cols-[220px_minmax(0,760px)] lg:gap-16">
        <nav aria-label="On this page" className="hidden lg:block">
          <ol className="sticky top-[calc(var(--header-h)+24px)] space-y-2 text-[14px]">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-ink-muted transition-colors duration-fast hover:text-ink">
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <article className="space-y-10 text-[15.5px] leading-relaxed text-ink-2 [&_li]:pl-1 [&_p+p]:mt-3 [&_p+ul]:mt-3 [&_ul+p]:mt-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
          {SECTIONS.map((s, i) => (
            <section key={s.id} id={s.id} aria-labelledby={`${s.id}-h`} className="scroll-mt-28">
              <h2 id={`${s.id}-h`} className="mb-3 text-[20px] font-semibold tracking-[-0.01em] text-ink">
                {i + 1}. {s.title}
              </h2>
              {s.body}
            </section>
          ))}
        </article>
      </div>
    </div>
  );
}
