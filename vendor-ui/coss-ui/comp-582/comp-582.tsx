import {
  FileTextIcon,
  GlobeIcon,
  HomeIcon,
  LayersIcon,
  UsersIcon,
} from "lucide-react";
import { useId } from "react";

import Logo from "@/registry/default/components/navbar-components/logo";
import ThemeToggle from "@/registry/default/components/navbar-components/theme-toggle";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/registry/default/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/registry/default/ui/tooltip";

// Navigation links with icons for desktop icon-only navigation
const navigationLinks = [
  { active: true, href: "#", icon: HomeIcon, label: "Dashboard" },
  { href: "#", icon: LayersIcon, label: "Projects" },
  { href: "#", icon: FileTextIcon, label: "Documentation" },
  { href: "#", icon: UsersIcon, label: "Team" },
];

// Language options
const languages = [
  { label: "En", value: "en" },
  { label: "Es", value: "es" },
  { label: "Fr", value: "fr" },
  { label: "De", value: "de" },
  { label: "Ja", value: "ja" },
];

export default function Component() {
  const id = useId();

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
            <PopoverContent align="start" className="w-36 p-1 md:hidden">
              <NavigationMenu className="max-w-none *:w-full">
                <NavigationMenuList className="flex-col items-start gap-0 md:gap-2">
                  {navigationLinks.map((link, _index) => {
                    const Icon = link.icon;
                    return (
                      <NavigationMenuItem className="w-full" key={link.label}>
                        <NavigationMenuLink
                          active={link.active}
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
          <div className="flex items-center gap-6">
            {/* Logo */}
            <a className="text-primary hover:text-primary/90" href="#">
              <Logo />
            </a>
            {/* Desktop navigation - icon only */}
            <NavigationMenu className="hidden md:flex">
              <NavigationMenuList className="gap-2">
                <TooltipProvider>
                  {navigationLinks.map((link) => (
                    <NavigationMenuItem key={link.label}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <NavigationMenuLink
                            className="flex size-8 items-center justify-center p-1.5"
                            href={link.href}
                          >
                            <link.icon aria-hidden="true" size={20} />
                            <span className="sr-only">{link.label}</span>
                          </NavigationMenuLink>
                        </TooltipTrigger>
                        <TooltipContent
                          className="px-2 py-1 text-xs"
                          side="bottom"
                        >
                          <p>{link.label}</p>
                        </TooltipContent>
                      </Tooltip>
                    </NavigationMenuItem>
                  ))}
                </TooltipProvider>
              </NavigationMenuList>
            </NavigationMenu>
          </div>
        </div>
        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <ThemeToggle />
          {/* Language selector */}
          <Select defaultValue="en">
            <SelectTrigger
              aria-label="Select language"
              className="h-8 border-none px-2 shadow-none hover:bg-accent hover:text-accent-foreground [&>svg]:shrink-0 [&>svg]:text-muted-foreground/80"
              id={`language-${id}`}
            >
              <GlobeIcon aria-hidden="true" size={16} />
              <SelectValue className="hidden sm:inline-flex" />
            </SelectTrigger>
            <SelectContent className="[&_*[role=option]>span]:start-auto [&_*[role=option]>span]:end-2 [&_*[role=option]>span]:flex [&_*[role=option]>span]:items-center [&_*[role=option]>span]:gap-2 [&_*[role=option]]:ps-2 [&_*[role=option]]:pe-8">
              {languages.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                  <span className="flex items-center gap-2">
                    <span className="truncate">{lang.label}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* User menu */}
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
