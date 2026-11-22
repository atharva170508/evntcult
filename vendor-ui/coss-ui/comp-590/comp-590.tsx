import {
  CompassIcon,
  FeatherIcon,
  HouseIcon,
  PlusIcon,
  SearchIcon,
} from "lucide-react";

import NotificationMenu from "@/registry/default/components/navbar-components/notification-menu";
import TeamSwitcher from "@/registry/default/components/navbar-components/team-switcher";
import UserMenu from "@/registry/default/components/navbar-components/user-menu";
import { Button } from "@/registry/default/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/registry/default/ui/navigation-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/registry/default/ui/popover";

const teams = ["Acme Inc.", "coss.com", "Junon"];

// Navigation links array to be used in both desktop and mobile menus
const navigationLinks = [
  { href: "#", icon: HouseIcon, label: "Dashboard" },
  { href: "#", icon: CompassIcon, label: "Explore" },
  { href: "#", icon: FeatherIcon, label: "Write" },
  { href: "#", icon: SearchIcon, label: "Search" },
];

export default function Component() {
  return (
    <header className="border-b px-4 md:px-6">
      <div className="flex h-16 items-center justify-between gap-4">
        {/* Left side */}
        <div className="flex flex-1 items-center gap-2">
          {/* Mobile menu trigger */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                className="group size-8 md:hidden"
                size="icon"
                variant="ghost"
              >
                <svg
                  className="pointer-events-none"
                  fill="none"
                  height={16}
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  width={16}
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    className="-translate-y-[7px] origin-center transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-x-0 group-aria-expanded:translate-y-0 group-aria-expanded:rotate-315"
                    d="M4 12L20 12"
                  />
                  <path
                    className="origin-center transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.8)] group-aria-expanded:rotate-45"
                    d="M4 12H20"
                  />
                  <path
                    className="origin-center translate-y-[7px] transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-y-0 group-aria-expanded:rotate-135"
                    d="M4 12H20"
                  />
                </svg>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-48 p-1 md:hidden">
              <NavigationMenu className="max-w-none *:w-full">
                <NavigationMenuList className="flex-col items-start gap-0 md:gap-2">
                  {navigationLinks.map((link, _index) => {
                    const Icon = link.icon;
                    return (
                      <NavigationMenuItem className="w-full" key={link.label}>
                        <NavigationMenuLink
                          className="flex-row items-center gap-2 py-1.5"
                          href={link.href}
                        >
                          <Icon
                            aria-hidden="true"
                            className="text-muted-foreground"
                            size={16}
                          />
                          <span>{link.label}</span>
                        </NavigationMenuLink>
                      </NavigationMenuItem>
                    );
                  })}
                </NavigationMenuList>
              </NavigationMenu>
            </PopoverContent>
          </Popover>
          <TeamSwitcher defaultTeam={teams[0]} teams={teams} />
        </div>
        {/* Middle area */}
        <NavigationMenu className="max-md:hidden">
          <NavigationMenuList className="gap-2">
            {navigationLinks.map((link, _index) => {
              const Icon = link.icon;
              return (
                <NavigationMenuItem key={link.label}>
                  <NavigationMenuLink
                    className="flex size-8 items-center justify-center p-1.5"
                    href={link.href}
                    title={link.label}
                  >
                    <Icon aria-hidden="true" />
                    <span className="sr-only">{link.label}</span>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              );
            })}
          </NavigationMenuList>
        </NavigationMenu>
        {/* Right side */}
        <div className="flex flex-1 items-center justify-end gap-4">
          <Button className="text-sm max-sm:aspect-square max-sm:p-0" size="sm">
            <PlusIcon
              aria-hidden="true"
              className="sm:-ms-1 opacity-60"
              size={16}
            />
            <span className="max-sm:sr-only">Post</span>
          </Button>
          <NotificationMenu />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
