import { XIcon } from "lucide-react";

import { Button } from "@/registry/default/ui/button";

export default function Component() {
  return (
    // To make the notification fixed, add classes like `fixed bottom-4 right-4` to the container element.
    <div className="z-50 max-w-[400px] rounded-md border bg-background p-4 shadow-lg">
      <div className="flex gap-3">
        <img
          alt="Mary Palmer"
          className="size-9 rounded-full"
          height={32}
          src="/origin/avatar-32-01.jpg"
          width={32}
        />
        <div className="flex grow flex-col gap-3">
          <div className="space-y-1">
            <p className="text-muted-foreground text-sm">
              <a
                className="font-medium text-foreground hover:underline"
                href="#"
              >
                Mary Palmer
              </a>{" "}
              mentioned you in{" "}
              <a
                className="font-medium text-foreground hover:underline"
                href="#"
              >
                project-campaign-02
              </a>
              .
            </p>
            <p className="text-muted-foreground text-xs">2 min ago</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm">Accept</Button>
            <Button size="sm" variant="outline">
              Decline
            </Button>
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
  );
}
