export interface NavItem {
  href: string;
  label: string;
  /** Shorter label for the phone bar. */
  short?: string;
}

/** The main menu: across the top on laptops, along the bottom on phones. Words only (§3). */
export const NAV: NavItem[] = [
  { href: "/dashboard", label: "Home" },
  { href: "/events", label: "Discover" },
  { href: "/calendar", label: "Calendar" },
  { href: "/passes", label: "My Passes", short: "Passes" },
  { href: "/certificates", label: "Certificates", short: "Certs" },
];

/** Visitors: the calendar is on the landing page itself. Everything else asks them to sign in. */
export const VISITOR_HREF: Record<string, string> = { "/dashboard": "/", "/calendar": "/#calendar" };

/** Pages that moved into the avatar menu. */
export const MORE: NavItem[] = [
  { href: "/profile", label: "Profile" },
  { href: "/vault", label: "Photo Vault" },
  { href: "/venues", label: "Venues" },
];

export const isActive = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);
