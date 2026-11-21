import Link from "next/link";
import { ThemeSwitch } from "./ThemeSwitch";
import type { NavViewer } from "./SiteHeader";

/** Light grey footer: three columns of destinations and a quiet bottom line. */
export function SiteFooter({ viewer }: { viewer: NavViewer | null }) {
  const all: { title: string; links: { href: string; label: string }[] }[] = [
    {
      title: "Explore",
      links: [
        { href: "/events", label: "All events" },
        { href: "/events?when=today", label: "Happening today" },
        { href: "/events?when=weekend", label: "This weekend" },
        { href: "/events?price=free", label: "Free events" },
        { href: "/calendar", label: "Campus calendar" },
        { href: "/venues", label: "Venues and directions" },
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
        : viewer
          ? [
              { href: "/host", label: "Apply to host events" },
              { href: "/dashboard#hosts", label: "How hosting works" },
            ]
          : [],
    },
    {
      title: "EvntCult",
      links: [
        { href: "/passes", label: "Your passes" },
        { href: "/vault", label: "Photos" },
        { href: "/certificates", label: "Certificates" },
        { href: "/get-app", label: "Get the app" },
        { href: "/terms", label: "Terms & Conditions" },
        ...(viewer ? [{ href: "/profile", label: "Account" }] : [{ href: "/signin?mode=signup", label: "Create an account" }]),
      ],
    },
  ];

  // Hosting is for approved organizers, so visitors don't get a Hosting column at all.
  const columns = all.filter((c) => c.links.length > 0);

  return (
    <footer className="border-t border-line bg-sunken print:hidden">
      <div className="mx-auto max-w-[1360px] px-gutter pb-28 pt-12 md:pb-8">
        <nav aria-label="Footer" className="grid gap-y-8 md:grid-cols-3 md:gap-x-12">
          {columns.map((c, i) => (
            <div key={c.title} className={i > 0 ? "border-t border-line-strong pt-8 md:border-0 md:pt-0" : undefined}>
              <h2 className="text-[14px] font-semibold text-ink">{c.title}</h2>
              <ul className="mt-2">
                {c.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="inline-flex min-h-11 items-center text-[14px] text-ink-2 hover:underline hover:underline-offset-2">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
        <div className="mt-12 flex flex-col gap-4 border-t border-line-strong pt-6 text-[14px] text-ink-2 sm:flex-row sm:items-start sm:justify-between">
          <p>
            © {new Date().getFullYear()} EvntCult ·{" "}
            <a href="mailto:evntcult@gmail.com" className="hover:underline hover:underline-offset-2">
              evntcult@gmail.com
            </a>
          </p>
          <ThemeSwitch className="w-full max-w-[280px] sm:w-[280px]" />
          <p className="sm:text-right">
            <span className="block font-semibold text-ink">Made by Synchronous Labs</span>
            <span className="block text-ink-muted">Many minds. One momentum.</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
