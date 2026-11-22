"use client";

import { ClockIcon } from "lucide-react";
import { Label } from "react-aria-components";

import { DateInput, TimeField } from "@/registry/default/ui/datefield-rac";

export default function Component() {
  return (
    <TimeField className="*:not-first:mt-2">
      <Label className="font-medium text-foreground text-sm">
        Time input with start icon
      </Label>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 start-0 z-10 flex items-center justify-center ps-3 text-muted-foreground/80">
          <ClockIcon aria-hidden="true" size={16} />
        </div>
        <DateInput className="ps-9" />
      </div>
      <p
        aria-live="polite"
        className="mt-2 text-muted-foreground text-xs"
        role="region"
      >
        Built with{" "}
        <a
          className="underline hover:text-foreground"
          href="https://react-spectrum.adobe.com/react-aria/DateField.html"
          rel="noreferrer noopener nofollow"
          target="_blank"
        >
          React Aria
        </a>
      </p>
    </TimeField>
  );
}
