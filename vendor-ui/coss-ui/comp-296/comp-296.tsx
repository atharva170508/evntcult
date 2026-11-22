import { RadioIcon, XIcon } from "lucide-react";

import { Button } from "@/registry/default/ui/button";

export default function Component() {
  return (
    // To make the notification fixed, add classes like `fixed bottom-4 right-4` to the container element.
    <div className="z-50 max-w-[400px] rounded-md border bg-background p-4 shadow-lg">
      <div className="flex items-center gap-2">
        <div
          aria-hidden="true"
          className="flex size-9 shrink-0 items-center justify-center rounded-full border"
        >
          <RadioIcon className="opacity-60" size={16} />
        </div>
        <div className="flex grow items-center gap-12">
          <div className="space-y-1">
            <p className="font-medium text-sm">Live in 27 hours</p>
            <p className="text-muted-foreground text-xs">
              November 20 at 8:00 PM.
            </p>
          </div>
          <Button size="sm">Notify me</Button>
        </div>
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
