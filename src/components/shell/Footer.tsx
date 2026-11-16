import Link from "next/link";
import { Wordmark } from "@/components/brand/Wordmark";
import type { NavViewer } from "./TopBar";

/** Multi-column footer with the oversized wordmark sign-off. */
export function Footer({ viewer }: { viewer: NavViewer | null }) {
  const columns: { title: string; links: { href: string; label: string }[] }[] = [
    {
      title: "Explore",
      links: [
        { href: "/events", label: "Discover events" },
        { href: "/calendar", label: "Campus calendar" },
        { href: "/venues", label: "Venues & directions" },
      ],
    },
    {
      title: "Your stuff",
      links: [
        { href: "/passes", label: "My passes" },
        { href: "/vault", label: "Photo Vault" },
        { href: "/certificates", label: "Certificates" },
      ],
    },
    viewer
      ? {
          title: "Account",
          links: [
            { href: "/profile", label: "Profile" },
            ...(viewer.isOrganizer
              ? [
                  { href: "/organizer", label: "Organizer console" },
                  { href: "/organizer/events/new", label: "Create an event" },
                ]
              : []),
          ],
        }
      : {
          title: "Account",
          links: [
            { href: "/signin?mode=signup", label: "Sign up free" },
            { href: "/signin", label: "Log in" },
          ],
        },
  ];

  return (
    <footer className="mt-24 border-t border-line print:hidden">
      <div className="mx-auto max-w-shell px-gutter pt-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="max-w-xs">
            <p className="text-h4 font-semibold">Every campus event, one pass.</p>
            <p className="mt-2 text-small text-ink-muted">Discover, register, walk in with a scan and relive it after. Built for college life.</p>
          </div>
          {columns.map((c) => (
            <nav key={c.title} aria-label={c.title}>
              <p className="eyebrow">{c.title}</p>
              <ul className="mt-4 space-y-2.5">
                {c.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-[14px] text-ink-2 transition-colors duration-fast hover:text-ink">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-14 flex flex-wrap items-center justify-between gap-3 border-t border-line py-5 text-[12.5px] text-ink-subtle">
          <span>© {new Date().getFullYear()} EvntCult</span>
          <span className="font-mono uppercase tracking-[0.08em]">Made for campus life · IST</span>
        </div>
      </div>
      <div className="-mb-[0.18em] pb-24 md:pb-0" aria-hidden>
        <Wordmark />
      </div>
    </footer>
  );
}
