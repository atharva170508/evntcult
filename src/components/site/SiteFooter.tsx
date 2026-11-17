import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { BrandLogo, BrandTile } from "./Brand";
import type { NavViewer } from "./SiteHeader";

/** Quiet, dense footer: a sign-off line, the app, and every destination in one place. */
export function SiteFooter({ viewer }: { viewer: NavViewer | null }) {
  const columns: { title: string; links: { href: string; label: string }[] }[] = [
    {
      title: "Explore",
      links: [
        { href: "/events", label: "All events" },
        { href: "/events?when=today", label: "Happening today" },
        { href: "/events?when=weekend", label: "This weekend" },
        { href: "/calendar", label: "Campus calendar" },
        { href: "/venues", label: "Venues and directions" },
      ],
    },
    {
      title: "Your things",
      links: [
        { href: "/passes", label: "Passes" },
        { href: "/vault", label: "Photos" },
        { href: "/certificates", label: "Certificates" },
        { href: "/profile", label: "Profile" },
      ],
    },
    {
      title: "Hosting",
      links: viewer?.isOrganizer
        ? [
            { href: "/organizer", label: "Your events" },
            { href: "/organizer/events/new", label: "Create an event" },
            { href: "/organizer/calendar", label: "Host calendar" },
          ]
        : [
            { href: "/organizer/events/new", label: "Host an event" },
            { href: "/dashboard#hosts", label: "How hosting works" },
          ],
    },
  ];

  return (
    <footer className="mt-section border-t border-line bg-sunken print:hidden">
      <div className="mx-auto max-w-shell px-gutter pb-28 pt-14 md:pb-10 md:pt-20">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_2fr]">
          <div>
            <BrandLogo className="text-[22px]" />
            <p className="mt-6 max-w-[22ch] font-display text-[30px] font-medium leading-[1.12] tracking-[-0.02em] text-ink">
              See you at the gate.
            </p>
            <Link
              href="/get-app"
              className="group mt-8 inline-flex items-center gap-3 rounded-2xl bg-white p-2 pr-4 shadow-[0_0_0_1px_#E5E7EB] transition-shadow duration-base hover:shadow-float"
            >
              <BrandTile className="size-10" />
              <span>
                <span className="block text-[14px] font-semibold text-ink">Get the app</span>
                <span className="block text-[12.5px] text-ink-subtle">Your passes, one tap away</span>
              </span>
              <ArrowUpRight className="ml-2 size-4 text-ink-subtle transition-transform duration-base group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
            </Link>
          </div>
          <nav aria-label="Footer" className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3">
            {columns.map((c) => (
              <div key={c.title}>
                <h2 className="text-[13px] font-semibold text-ink">{c.title}</h2>
                <ul className="mt-4 space-y-3">
                  {c.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="text-[14px] text-ink-muted transition-colors duration-fast hover:text-ink">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
        <div className="mt-16 flex flex-col gap-3 border-t border-line-strong/60 pt-6 text-[13px] text-ink-subtle sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} EvntCult. Made in Nashik, India.</p>
          <div className="flex gap-5">
            {viewer ? (
              <Link href="/profile" className="transition-colors hover:text-ink">
                Account
              </Link>
            ) : (
              <>
                <Link href="/signin" className="transition-colors hover:text-ink">
                  Log in
                </Link>
                <Link href="/signin?mode=signup" className="transition-colors hover:text-ink">
                  Create an account
                </Link>
              </>
            )}
            <Link href="/get-app" className="transition-colors hover:text-ink">
              Install
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
