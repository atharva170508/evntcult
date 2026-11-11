"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoIcon } from "@/components/brand/MissingE";

const NAV = [
  { href: "/organizer", label: "Home", exact: true },
  { href: "/organizer/events/new", label: "New", exact: true },
  { href: "/organizer/calendar", label: "Calendar", exact: false },
  { href: "/organizer/guests", label: "Guests", exact: false },
];

export function OrganizerNav() {
  const path = usePathname();
  return (
    <nav className="o-side" aria-label="Organizer">
      <Link href="/organizer" className="o-logo" aria-label="EvntCult organizer home">
        <LogoIcon className="size-[30px]" />
      </Link>
      {NAV.map((n) => {
        const current = (n.exact ? path === n.href : path.startsWith(n.href)) ? "page" : undefined;
        // A full load: the page's address is swapped to the draft after the first save, so a soft link back to /new would keep the old form.
        if (n.href === "/organizer/events/new")
          return (
            <a key={n.href} href={n.href} className="o-nav" aria-current={current}>
              {n.label}
            </a>
          );
        return (
          <Link key={n.href} href={n.href} className="o-nav" aria-current={current}>
            {n.label}
          </Link>
        );
      })}
      <Link href="/dashboard" className="o-nav">
        Site
      </Link>
    </nav>
  );
}
