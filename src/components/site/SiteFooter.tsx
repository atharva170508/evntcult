import Link from "next/link";
import { ThemeSwitch } from "./ThemeSwitch";
import { FooterHours, FooterWordmark } from "./FooterWordmark";
import type { NavViewer } from "./SiteHeader";

/**
 * Tape Room style footer: ink ground (#151412), hairline rule, address & hours
 * with today highlighted in gold, four quiet mono links, and giant cropped EVNTCULT wordmark.
 */
export function SiteFooter({ viewer }: { viewer: NavViewer | null }) {
  const links = [
    { href: "/events", label: "Events" },
    { href: "/calendar", label: "Calendar" },
    { href: "/passes", label: "Passes" },
    { href: viewer?.isOrganizer ? "/organizer" : "/host", label: "Host" },
  ];

  return (
    <footer className="overflow-hidden border-t border-[rgba(238,232,221,0.15)] bg-[#151412] text-[#EEE8DD] print:hidden">
      <div className="mx-auto max-w-[1200px] px-5 pb-24 pt-16 md:px-10 md:pb-8 md:pt-24">
        <div className="grid gap-10 md:grid-cols-[1.2fr_1fr_auto] md:items-start">
          <div className="space-y-2">
            <p className="font-display text-[24px] leading-none tracking-[-0.02em] text-[#EEE8DD]">
              EVNTCULT
            </p>
            <p className="text-[14px] font-light text-[#9A9284]">
              Campus events, direct UPI, offline QR entry.
            </p>
            <p className="pt-2 font-mono text-[11px] uppercase tracking-[0.06em] text-[#9A9284]">
              <a
                href="mailto:evntcult@gmail.com"
                className="tr-link text-[#EEE8DD]/80 hover:text-[#C9A26B]"
              >
                evntcult@gmail.com
              </a>
              <span className="mx-2 text-[#EEE8DD]/25">/</span>
              <Link href="/terms" className="tr-link text-[#EEE8DD]/80 hover:text-[#C9A26B]">
                Terms
              </Link>
            </p>
          </div>

          <div className="space-y-4">
            <FooterHours />
            <ThemeSwitch className="max-w-[230px]" />
          </div>

          <nav aria-label="Footer" className="flex flex-wrap gap-x-7 gap-y-3 md:justify-end">
            {links.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="tr-meta tr-link inline-flex min-h-[44px] items-center text-[#EEE8DD]/80 hover:text-[#C9A26B]"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <FooterWordmark />
      </div>
    </footer>
  );
}
