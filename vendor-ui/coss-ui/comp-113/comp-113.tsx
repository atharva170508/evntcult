import { ChevronDownIcon, PinIcon } from "lucide-react";

import { Button } from "@/registry/default/ui/button";

export default function Component() {
  return (
    <div className="inline-flex divide-x divide-primary-foreground/30 rounded-md shadow-xs rtl:space-x-reverse">
      <Button
        aria-label="Options"
        className="rounded-none shadow-none first:rounded-s-md last:rounded-e-md focus-visible:z-10"
        size="icon"
      >
        <ChevronDownIcon aria-hidden="true" size={16} />
      </Button>
      <Button className="rounded-none shadow-none first:rounded-s-md last:rounded-e-md focus-visible:z-10">
        <PinIcon aria-hidden="true" className="-ms-1 opacity-60" size={16} />
        Pinned
      </Button>
    </div>
  );
}
