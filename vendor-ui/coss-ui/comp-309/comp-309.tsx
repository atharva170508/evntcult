"use client";

import { RocketIcon, XIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/registry/default/ui/button";

export default function Component() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="dark bg-muted px-4 py-3 text-foreground">
      <div className="flex gap-2 md:items-center">
        <div className="flex grow gap-3 md:items-center">
          <div
            aria-hidden="true"
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 max-md:mt-0.5"
          >
            <RocketIcon className="opacity-80" size={16} />
          </div>
          <div className="flex grow flex-col justify-between gap-3 md:flex-row md:items-center">
            <div className="space-y-0.5">
              <p className="font-medium text-sm">
                Boost your experience with coss.com
              </p>
              <p className="text-muted-foreground text-sm">
                The new feature is live! Try it out and let us know what you
                think.
              </p>
            </div>
            <div className="flex gap-2 max-md:flex-wrap">
              <Button className="text-sm" size="sm">
                Try now
              </Button>
            </div>
          </div>
        </div>
        <Button
          aria-label="Close banner"
          className="group -my-1.5 -me-2 size-8 shrink-0 p-0 hover:bg-transparent"
          onClick={() => setIsVisible(false)}
          variant="ghost"
        >
          <XIcon
            aria-hidden="true"
            className="opacity-60 transition-opacity group-hover:opacity-100"
            size={16}
          />
        </Button>
      </div>
    </div>
  );
}
