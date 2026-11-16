import {
  Award,
  CalendarDays,
  Compass,
  House,
  Images,
  LayoutDashboard,
  MapPinned,
  Ticket,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

/** Main menu (sidebar on laptops, drawer + bottom tabs on phones). */
export const NAV: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: House },
  { href: "/events", label: "Discover", icon: Compass },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/passes", label: "My passes", icon: Ticket },
  { href: "/vault", label: "Photo Vault", icon: Images },
  { href: "/certificates", label: "Certificates", icon: Award },
  { href: "/venues", label: "Venues", icon: MapPinned },
];

export const ORGANIZER_NAV: NavItem = { href: "/organizer", label: "Organizer", icon: LayoutDashboard };

/** Sidebar groups. */
export const NAV_GROUPS: { label: string; hrefs: string[] }[] = [
  { label: "Explore", hrefs: ["/dashboard", "/events", "/calendar", "/venues"] },
  { label: "You", hrefs: ["/passes", "/vault", "/certificates"] },
];

/** Links for signed-out visitors (top bar + drawer). */
export const PUBLIC_NAV: { href: string; label: string }[] = [
  { href: "/events", label: "Discover" },
  { href: "/dashboard#onepass", label: "OnePass" },
  { href: "/calendar", label: "Calendar" },
  { href: "/venues", label: "Venues" },
];

export const isActive = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);
