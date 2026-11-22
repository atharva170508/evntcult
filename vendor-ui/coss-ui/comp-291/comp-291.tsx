import { CircleCheckIcon, XIcon } from "lucide-react";

import { Button } from "@/registry/default/ui/button";

export default function Component() {
  return (
    // To make the notification fixed, add classes like `fixed bottom-4 right-4` to the container element.
    <div className="z-50 max-w-[400px] rounded-md border bg-background p-4 shadow-lg">
      <div className="flex gap-2">
        <div className="flex grow gap-3">
          <CircleCheckIcon
            aria-hidden="true"
            className="mt-0.5 shrink-0 text-emerald-500"
            size={16}
          />
          <div className="flex grow flex-col gap-3">
            <div className="space-y-1">
              <p className="font-medium text-sm">Your request was completed!</p>
              <p className="text-muted-foreground text-sm">
                It demonstrates that the task or request has been processed.
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm">Learn more</Button>
            </div>
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
    </div>
  );
}
