import {
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

/** Main menu (sidebar on laptops, bottom tabs on phones). */
export const NAV: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: House },
  { href: "/events", label: "Discover", icon: Compass },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/passes", label: "My passes", icon: Ticket },
  { href: "/vault", label: "Photo Vault", icon: Images },
  { href: "/venues", label: "Venues", icon: MapPinned },
];

export const ORGANIZER_NAV: NavItem = { href: "/organizer", label: "Organizer", icon: LayoutDashboard };

export const isActive = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);
