export interface NavItem {
  href: string;
  label: string;
  /** Shorter label for the phone bar. */
  short?: string;
}

/** Main menu (sidebar on laptops, bottom bar on phones). Words only — no icons (§3). */
export const NAV: NavItem[] = [
  { href: "/dashboard", label: "Home" },
  { href: "/events", label: "Discover" },
  { href: "/calendar", label: "Calendar" },
  { href: "/passes", label: "My passes", short: "Passes" },
  { href: "/vault", label: "Photo Vault", short: "Photos" },
  { href: "/certificates", label: "Certificates" },
  { href: "/venues", label: "Venues" },
];

export const ORGANIZER_NAV: NavItem = { href: "/organizer", label: "Organizer", short: "Host" };

export const isActive = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);
