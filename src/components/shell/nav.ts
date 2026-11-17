import {
  Award,
  CalendarDays,
  CalendarRange,
  Compass,
  House,
  LayoutGrid,
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

/**
 * The five main destinations, in the header on laptops and the tab bar on phones. Photo Vault,
 * Venues and Profile live in the account menu.
 */
export const ATTEND_NAV: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: House },
  { href: "/events", label: "Discover", icon: Compass },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/passes", label: "My Passes", short: "Passes", icon: Ticket },
  { href: "/certificates", label: "Certificates", short: "Certs", icon: Award },
];

/** Signed-out visitors see the campus calendar on the homepage itself, so Calendar points there. */
export const VISITOR_HREF: Record<string, string> = { "/calendar": "/dashboard#calendar" };

/** Home stays lit on the homepage only; every other item matches its own section. */
export function isMainActive(pathname: string, href: string) {
  return href === "/dashboard" ? pathname === "/dashboard" : pathname === href || pathname.startsWith(`${href}/`);
}

export const HOST_NAV: NavItem[] = [
  { href: "/organizer", label: "Events", icon: LayoutGrid, exact: true },
  { href: "/organizer/calendar", label: "Calendar", icon: CalendarRange },
];

export const ADMIN_NAV: NavItem[] = [{ href: "/admin", label: "Overview", icon: ShieldCheck }];

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
