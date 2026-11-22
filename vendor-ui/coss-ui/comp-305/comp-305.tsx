"use client";

import { ArrowRightIcon, Eclipse, XIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/registry/default/ui/button";

export default function Component() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="dark bg-muted px-4 py-3 text-foreground">
      <div className="flex gap-2">
        <div className="flex grow gap-3">
          <Eclipse
            aria-hidden="true"
            className="mt-0.5 shrink-0 opacity-60"
            size={16}
          />
          <div className="flex grow flex-col justify-between gap-2 md:flex-row">
            <p className="text-sm">
              We just added something awesome to make your experience even
              better.
            </p>
            <a className="group whitespace-nowrap font-medium text-sm" href="#">
              Learn more
              <ArrowRightIcon
                aria-hidden="true"
                className="-mt-0.5 ms-1 inline-flex opacity-60 transition-transform group-hover:translate-x-0.5"
                size={16}
              />
            </a>
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
