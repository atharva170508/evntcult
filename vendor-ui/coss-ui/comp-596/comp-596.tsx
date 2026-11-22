"use client";

import { ClockIcon, PowerIcon, PowerOffIcon, ZapIcon } from "lucide-react";
import { useId, useState } from "react";

import { Badge } from "@/registry/default/ui/badge";
import { Button } from "@/registry/default/ui/button";
import { Label } from "@/registry/default/ui/label";
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
import { Switch } from "@/registry/default/ui/switch";

// Navigation links array to be used in both desktop and mobile menus
const navigationLinks = [
  { active: true, href: "#", label: "Overview" },
  { href: "#", label: "Graphs" },
  { href: "#", label: "Backups" },
];

export default function Component() {
  const id = useId();
  const [checked, setChecked] = useState<boolean>(true);

  return (
    <header className="border-b px-4 md:px-6">
      <div className="flex h-16 justify-between gap-4">
        {/* Left side */}
        <div className="flex gap-2">
          <div className="flex items-center md:hidden">
            {/* Mobile menu trigger */}
            <Popover>
              <PopoverTrigger asChild>
                <Button className="group size-8" size="icon" variant="ghost">
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
                    {navigationLinks.map((link, _index) => (
                      <NavigationMenuItem className="w-full" key={link.label}>
                        <NavigationMenuLink className="py-1.5" href={link.href}>
                          {link.label}
                        </NavigationMenuLink>
                      </NavigationMenuItem>
                    ))}
                  </NavigationMenuList>
                </NavigationMenu>
              </PopoverContent>
            </Popover>
          </div>
          {/* Main nav */}
          <div className="flex items-center gap-6">
            {/* Navigation menu */}
            <NavigationMenu className="h-full *:h-full max-md:hidden">
              <NavigationMenuList className="h-full gap-2">
                {navigationLinks.map((link, _index) => (
                  <NavigationMenuItem className="h-full" key={link.label}>
                    <NavigationMenuLink
                      data-active={link.active ? "" : undefined}
                      className="h-full justify-center rounded-none border-transparent border-y-2 py-1.5 font-medium text-muted-foreground hover:border-b-primary hover:bg-transparent hover:text-primary data-[active]:border-b-primary data-[active]:bg-transparent!"
                      href={link.href}
                    >
                      {link.label}
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>
          </div>
        </div>
        {/* Right side */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Badge className="gap-1.5 text-emerald-600" variant="outline">
              <span
                aria-hidden="true"
                className="size-1.5 rounded-full bg-emerald-500"
              />
              Online
            </Badge>
            <Badge className="gap-1.5" variant="outline">
              <ZapIcon
                aria-hidden="true"
                className="-ms-0.5 opacity-60"
                size={12}
              />
              99.9%
            </Badge>
            <Badge className="gap-1.5" variant="outline">
              <ClockIcon
                aria-hidden="true"
                className="-ms-0.5 opacity-60"
                size={12}
              />
              45ms
            </Badge>
          </div>
          {/* Switch */}
          <div>
            <div className="relative inline-grid h-7 grid-cols-[1fr_1fr] items-center font-medium text-sm">
              <Switch
                checked={checked}
                className="peer [&_span]:data-[state=checked]:rtl:-translate-x-full absolute inset-0 h-[inherit] w-auto data-[state=unchecked]:bg-input/50 [&_span]:z-10 [&_span]:h-full [&_span]:w-1/2 [&_span]:transition-transform [&_span]:duration-300 [&_span]:ease-[cubic-bezier(0.16,1,0.3,1)] [&_span]:data-[state=checked]:translate-x-full"
                id={id}
                onCheckedChange={setChecked}
              />
              <span className="peer-data-[state=unchecked]:rtl:-translate-x-full pointer-events-none relative ms-0.5 flex w-6 items-center justify-center text-center transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] peer-data-[state=checked]:invisible peer-data-[state=unchecked]:translate-x-full">
                <PowerOffIcon aria-hidden="true" size={12} />
              </span>
              <span className="peer-data-[state=checked]:-translate-x-full pointer-events-none relative me-0.5 flex w-6 items-center justify-center text-center transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] peer-data-[state=unchecked]:invisible peer-data-[state=checked]:text-background peer-data-[state=checked]:rtl:translate-x-full">
                <PowerIcon aria-hidden="true" size={12} />
              </span>
            </div>
            <Label className="sr-only" htmlFor={id}>
              Power
            </Label>
          </div>
        </div>
      </div>
    </header>
  );
}
