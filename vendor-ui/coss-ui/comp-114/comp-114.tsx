import { ChevronDownIcon, GitForkIcon } from "lucide-react";

import { Button } from "@/registry/default/ui/button";

export default function Component() {
  return (
    <div className="inline-flex divide-x divide-primary-foreground/30 rounded-md shadow-xs rtl:space-x-reverse">
      <Button className="rounded-none shadow-none first:rounded-s-md last:rounded-e-md focus-visible:z-10">
        <GitForkIcon aria-hidden="true" className="opacity-60" size={16} />
        Fork
        <span className="-me-1 ms-1 inline-flex h-5 max-h-full items-center rounded border border-primary-foreground/30 px-1 font-[inherit] font-medium text-[0.625rem] text-primary-foreground/60">
          18
        </span>
      </Button>
      <Button
        aria-label="Options"
        className="rounded-none shadow-none first:rounded-s-md last:rounded-e-md focus-visible:z-10"
        size="icon"
      >
        <ChevronDownIcon aria-hidden="true" size={16} />
      </Button>
    </div>
  );
}
