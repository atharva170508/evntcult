import Link from "next/link";
import { ThemeSwitch } from "./ThemeSwitch";
import type { NavViewer } from "./SiteHeader";

/** Minimal deep charcoal footer: Cormorant italic gold wordmark + essential links only. */
export function SiteFooter({ viewer }: { viewer: NavViewer | null }) {
  const links = [
    { href: "/events", label: "Events" },
    { href: "/calendar", label: "Calendar" },
    { href: "/passes", label: "Passes" },
    { href: viewer?.isOrganizer ? "/organizer" : "/host", label: "Host" },
    { href: "/terms", label: "Terms" },
  ];

  return (
    <footer className="border-t border-[#2E3342] bg-[#161820] text-[#EFEAE0] print:hidden">
      <div className="mx-auto max-w-[1200px] px-5 pb-24 pt-14 md:px-10 md:pb-12 md:pt-16">
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <p className="font-display text-[34px] font-semibold italic leading-none text-[#D4B87A]">
            EvntCult
          </p>

          <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-7 gap-y-2">
            {links.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="tr-meta tr-link inline-flex min-h-[44px] items-center text-[#EFEAE0]/80 hover:text-[#D4B87A]"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-8 flex flex-col gap-4 border-t border-[#2E3342] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="tr-meta text-[#9D978C]">
            © {new Date().getFullYear()} EvntCult · Synchronous Labs
          </p>
          <ThemeSwitch className="max-w-[220px]" />
        </div>
      </div>
    </footer>
  );
}
