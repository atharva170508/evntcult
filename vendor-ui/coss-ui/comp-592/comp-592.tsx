"use client";

import { LayoutGridIcon, PlusIcon, SearchIcon } from "lucide-react";
import { useId, useState } from "react";

import InfoMenu from "@/registry/default/components/navbar-components/info-menu";
import NotificationMenu from "@/registry/default/components/navbar-components/notification-menu";
import SettingsMenu from "@/registry/default/components/navbar-components/settings-menu";
import { Button } from "@/registry/default/ui/button";
import { Input } from "@/registry/default/ui/input";
import { Label } from "@/registry/default/ui/label";
import { Switch } from "@/registry/default/ui/switch";

export default function Component() {
  const id = useId();
  const [checked, setChecked] = useState<boolean>(true);

  return (
    <header className="border-b px-4 md:px-6">
      <div className="flex h-16 items-center justify-between gap-4">
        {/* Left side */}
        <div className="relative flex-1">
          <Input
            className="peer h-8 w-full max-w-xs ps-8 pe-2"
            id={`input-${id}`}
            placeholder="Search..."
            type="search"
          />
          <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-2 text-muted-foreground/80 peer-disabled:opacity-50">
            <SearchIcon size={16} />
          </div>
        </div>
        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Test mode */}
          <div className="inline-flex items-center gap-2 max-md:hidden">
            <Label className="font-medium text-sm" htmlFor={`switch-${id}`}>
              Test mode
            </Label>
            <Switch
              aria-label="Toggle switch"
              checked={checked}
              className="data-[state=checked]:[&_span]:rtl:-translate-x-3 h-5 w-8 [&_span]:size-4 data-[state=checked]:[&_span]:translate-x-3"
              id={`switch-${id}`}
              onCheckedChange={setChecked}
            />
          </div>
          <div className="flex items-center gap-2">
            {/* Layout button */}
            <Button
              aria-label="Open layout menu"
              className="size-8 rounded-full text-muted-foreground shadow-none"
              size="icon"
              variant="ghost"
            >
              <LayoutGridIcon aria-hidden="true" size={16} />
            </Button>
            {/* Info menu */}
            <InfoMenu />
            {/* Notification */}
            <NotificationMenu />
            {/* Settings */}
            <SettingsMenu />
          </div>
          {/* Add button */}
          <Button
            aria-label="Add new item"
            className="size-8 rounded-full"
            size="icon"
          >
            <PlusIcon aria-hidden="true" size={16} />
          </Button>
        </div>
      </div>
    </header>
  );
}
