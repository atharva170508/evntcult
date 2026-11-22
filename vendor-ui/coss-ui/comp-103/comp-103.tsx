import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";

import { Button } from "@/registry/default/ui/button";

export default function Component() {
  return (
    <div className="-space-x-px inline-flex rounded-full shadow-xs rtl:space-x-reverse">
      <Button
        aria-label="Upvote"
        className="rounded-none shadow-none first:rounded-s-full last:rounded-e-full focus-visible:z-10"
        size="icon"
      >
        <ChevronUpIcon aria-hidden="true" size={16} />
      </Button>
      <span className="flex items-center bg-primary px-1 font-medium text-primary-foreground text-sm">
        235
      </span>
      <Button
        aria-label="Downvote"
        className="rounded-none shadow-none first:rounded-s-full last:rounded-e-full focus-visible:z-10"
        size="icon"
      >
        <ChevronDownIcon aria-hidden="true" size={16} />
      </Button>
    </div>
  );
}
