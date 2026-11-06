import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { EventArt } from "@/components/ui/EventArt";

/**
 * Placeholder for sections that come in the next build pass, so every link
 * in the dashboard resolves. Real routes (e.g. app/(app)/calendar/page.tsx)
 * automatically take precedence over this catch-all.
 */
const SECTIONS: Record<string, { title: string; blurb: string; accent: string }> = {
  calendar: { title: "Campus Calendar", blurb: "Every public event plus your own, in month, week and agenda views.", accent: "blue" },
  events: { title: "Discover events", blurb: "Browse, filter and register — including private events unlocked with a code.", accent: "violet" },
  passes: { title: "Passes & Certificates", blurb: "All your QR passes, payment receipts and one-click certificates.", accent: "orange" },
  vault: { title: "Photo Vault", blurb: "Every event's gallery, with opt-in face match to find photos of you.", accent: "pink" },
  venues: { title: "Venue Navigator", blurb: "Campus map with walking directions to every hall, lab and ground.", accent: "teal" },
  organizer: { title: "Organizer Console", blurb: "Event builder, attendee lists, scanner, broadcasts, reminders and sponsor reports.", accent: "green" },
};

export default async function ComingSoon({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const s = SECTIONS[slug[0]] ?? { title: "Coming soon", blurb: "This part of EvntCult is on the way.", accent: "blue" };

  return (
    <section className="card relative isolate mt-6 flex min-h-[62vh] flex-col justify-end overflow-hidden p-8 text-white animate-fade-up md:p-12">
      <EventArt accent={s.accent} intensity={0.9} />
      <div className="relative max-w-xl">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-[12px] font-bold text-ink-inverse">
          <Sparkles className="size-3.5" /> Planned · not built yet
        </span>
        <h1 className="mt-4 text-[clamp(36px,5vw,56px)] font-extrabold leading-[1.04] tracking-tightest">{s.title}</h1>
        <p className="mt-3 text-[18px] text-white/90">{s.blurb}</p>
        <Link
          href="/dashboard"
          className="mt-8 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-[14px] font-semibold text-ink-inverse transition-colors hover:bg-white/90"
        >
          <ArrowLeft className="size-4" /> Back to home
        </Link>
      </div>
    </section>
  );
}
