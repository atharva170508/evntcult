"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/organizer", label: "Home", exact: true },
  { href: "/organizer/events/new", label: "New", exact: true },
  { href: "/organizer/calendar", label: "Calendar", exact: false },
];

export function OrganizerNav() {
  const path = usePathname();
  return (
    <nav className="o-side" aria-label="Organizer">
      <Link href="/organizer" className="o-logo" aria-label="EvntCult organizer home">
        E
      </Link>
      {NAV.map((n) => (
        <Link key={n.href} href={n.href} className="o-nav" aria-current={(n.exact ? path === n.href : path.startsWith(n.href)) ? "page" : undefined}>
          {n.label}
        </Link>
      ))}
      <Link href="/dashboard" className="o-nav">
        Site
      </Link>
    </nav>
  );
}
