import { ArrowRightIcon, InfoIcon, XIcon } from "lucide-react";

import { Button } from "@/registry/default/ui/button";

export default function Component() {
  return (
    // To make the notification fixed, add classes like `fixed bottom-4 right-4` to the container element.
    <div className="z-50 max-w-[400px] rounded-md border bg-background px-4 py-3 shadow-lg">
      <div className="flex gap-2">
        <div className="flex grow gap-3">
          <InfoIcon
            aria-hidden="true"
            className="mt-0.5 shrink-0 text-blue-500"
            size={16}
          />
          <div className="flex grow justify-between gap-12">
            <p className="text-sm">Just a quick note!</p>
            <a className="group whitespace-nowrap font-medium text-sm" href="#">
              Link
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
