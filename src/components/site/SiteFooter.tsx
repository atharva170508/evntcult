import Link from "next/link";
import { ThemeSwitch } from "./ThemeSwitch";
import { FooterFootnote, FooterWordmark } from "./FooterWordmark";
import type { NavViewer } from "./SiteHeader";
import { CATEGORY_HUBS } from "@/lib/discovery";

/** Monumental editorial footer: crisp directory columns, theme switcher, and full-bleed wordmark. */
export function SiteFooter({ viewer }: { viewer: NavViewer | null }) {
  const columns: { title: string; links: { href: string; label: string }[] }[] = [
    {
      title: "Explore",
      links: [
        { href: "/events", label: "All events" },
        { href: "/events?when=today", label: "Happening today" },
        { href: "/events?when=weekend", label: "This weekend" },
        { href: "/calendar", label: "Events calendar" },
        { href: "/venues", label: "Venues & directions" },
      ],
    },
    {
      title: "Categories",
      links: CATEGORY_HUBS.slice(0, 5).map((c) => ({ href: `/category/${c.slug}`, label: c.name })),
    },
    {
      title: "EvntCult",
      links: [
        { href: "/passes", label: "My passes" },
        { href: "/vault", label: "Photo Vault" },
        { href: "/certificates", label: "Certificates" },
        { href: "/get-app", label: "Install app" },
        ...(viewer?.isOrganizer
          ? [{ href: "/organizer", label: "Organizer studio" }]
          : [{ href: "/host", label: "Host an event" }]),
        ...(viewer
          ? [{ href: "/profile", label: "Account" }]
          : [{ href: "/signin?mode=signup", label: "Sign up free" }]),
      ],
    },
  ];

  return (
    <footer className="overflow-hidden border-t border-line-strong bg-sunken print:hidden">
      <div className="mx-auto max-w-[1360px] px-gutter pb-28 pt-12 md:pb-10 md:pt-16">
        <div className="grid gap-10 lg:grid-cols-[1fr_2fr] lg:gap-16">
          {/* Left editorial statement + theme switch */}
          <div className="flex flex-col justify-between gap-6">
            <div>
              <p className="font-display text-[32px] leading-[1.02] tracking-[-0.025em] text-ink">
                Every event on campus, <em>one pass.</em>
              </p>
              <p className="mt-3 max-w-[34ch] text-[14.5px] leading-relaxed text-ink-muted">
                Built by Synchronous Labs for college clubs, fests, hackathons, and student communities.
              </p>
            </div>
            <ThemeSwitch className="w-full max-w-[270px]" />
          </div>

          {/* Right directory columns */}
          <nav aria-label="Footer" className="grid grid-cols-2 gap-x-8 gap-y-8 sm:grid-cols-3">
            {columns.map((c) => (
              <div key={c.title}>
                <h2 className="text-[13px] font-semibold text-ink">{c.title}</h2>
                <ul className="mt-3 space-y-1">
                  {c.links.map((l) => (
                    <li key={l.href}>
                      <Link
                        href={l.href}
                        className="inline-flex min-h-9 items-center text-[14px] text-ink-2 transition-colors hover:text-ink hover:underline hover:underline-offset-4"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        {/* Bottom legal & contact bar */}
        <div className="mt-12 flex flex-col gap-3 border-t border-line-strong pt-6 text-[13.5px] text-ink-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} EvntCult ·{" "}
            <a href="mailto:evntcult@gmail.com" className="text-ink-2 hover:text-ink hover:underline">
              evntcult@gmail.com
            </a>
            {" · "}
            <Link href="/terms" className="text-ink-2 hover:text-ink hover:underline">
              Terms
            </Link>
          </p>
          <FooterFootnote />
        </div>

        {/* Monumental architectural wordmark (click letters to play a pentatonic note) */}
        <FooterWordmark />
      </div>
    </footer>
  );
}
