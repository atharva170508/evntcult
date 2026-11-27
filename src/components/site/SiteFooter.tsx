import Link from "next/link";
import { ThemeSwitch } from "./ThemeSwitch";
import { FooterHours } from "./FooterWordmark";
import type { NavViewer } from "./SiteHeader";

/** Deep charcoal editorial footer with Cormorant italic champagne-gold wordmark. */
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
      <div className="mx-auto max-w-[1200px] px-5 pb-24 pt-16 md:px-10 md:pb-14 md:pt-20">
        <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-display text-[36px] font-semibold italic leading-none text-[#D4B87A]">
              EvntCult
            </p>
            <p className="mt-3 max-w-[38ch] text-[14.5px] font-light text-[#9D978C]">
              Live events, direct organizer UPI, offline QR passes, and private Photo Vault.
            </p>
          </div>

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

        <div className="mt-10 flex flex-col gap-5 border-t border-[#2E3342] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <FooterHours />
            <p className="tr-meta text-[#9D978C]">
              © {new Date().getFullYear()} EvntCult · Synchronous Labs ·{" "}
              <a href="mailto:evntcult@gmail.com" className="text-[#EFEAE0]/80 hover:text-[#D4B87A]">
                evntcult@gmail.com
              </a>
            </p>
          </div>
          <ThemeSwitch className="max-w-[230px]" />
        </div>
      </div>
    </footer>
  );
}
