import { CircleCheckIcon, XIcon } from "lucide-react";

import { Button } from "@/registry/default/ui/button";

export default function Component() {
  return (
    // To make the notification fixed, add classes like `fixed bottom-4 right-4` to the container element.
    <div className="z-50 max-w-[400px] rounded-md border bg-background px-4 py-3 shadow-lg">
      <div className="flex gap-2">
        <p className="grow text-sm">
          <CircleCheckIcon
            aria-hidden="true"
            className="-mt-0.5 me-3 inline-flex text-red-500"
            size={16}
          />
          An error occurred!
        </p>
        <Button
          aria-label="Close notification"
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
