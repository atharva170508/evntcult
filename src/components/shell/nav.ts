import {
  Award,
  CalendarDays,
  CalendarRange,
  Compass,
  House,
  Images,
  LayoutGrid,
  MapPinned,
  ShieldCheck,
  Ticket,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  /** Shorter label for the phone tab bar. */
  short?: string;
  icon: LucideIcon;
  /** Only the exact path counts as active (for section roots like /organizer). */
  exact?: boolean;
}

/** The three areas of the product. Attend is the default; Host is for running events; Admin is staff-only. */
export type Workspace = "attend" | "host" | "admin";

export const ATTEND_NAV: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: House },
  { href: "/events", label: "Discover", icon: Compass },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/passes", label: "Passes", icon: Ticket },
  { href: "/vault", label: "Photos", icon: Images },
  { href: "/certificates", label: "Certificates", short: "Certs", icon: Award },
  { href: "/venues", label: "Venues", icon: MapPinned },
];

export const HOST_NAV: NavItem[] = [
  { href: "/organizer", label: "Events", icon: LayoutGrid, exact: true },
  { href: "/organizer/calendar", label: "Calendar", icon: CalendarRange },
];

export const ADMIN_NAV: NavItem[] = [{ href: "/admin", label: "Overview", icon: ShieldCheck }];

/** Links for signed-out visitors. */
export const PUBLIC_NAV: { href: string; label: string }[] = [
  { href: "/events", label: "Discover" },
  { href: "/dashboard#onepass", label: "OnePass" },
  { href: "/calendar", label: "Calendar" },
  { href: "/venues", label: "Venues" },
];

export function workspaceFor(pathname: string): Workspace {
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname.startsWith("/organizer")) return "host";
  return "attend";
}

export function navFor(ws: Workspace): NavItem[] {
  return ws === "host" ? HOST_NAV : ws === "admin" ? ADMIN_NAV : ATTEND_NAV;
}

export function isActive(pathname: string, item: Pick<NavItem, "href" | "exact">) {
  if (item.exact) return pathname === item.href || (item.href === "/organizer" && pathname.startsWith("/organizer/events"));
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
