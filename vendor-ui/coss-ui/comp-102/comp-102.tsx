import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";

import { Button } from "@/registry/default/ui/button";

export default function Component() {
  return (
    <div className="-space-x-px inline-flex rounded-md shadow-xs rtl:space-x-reverse">
      <Button
        aria-label="Upvote"
        className="rounded-none shadow-none first:rounded-s-md last:rounded-e-md focus-visible:z-10"
        size="icon"
        variant="outline"
      >
        <ChevronUpIcon aria-hidden="true" size={16} />
      </Button>
      <span className="flex items-center border border-input px-3 font-medium text-sm">
        235
      </span>
      <Button
        aria-label="Downvote"
        className="rounded-none shadow-none first:rounded-s-md last:rounded-e-md focus-visible:z-10"
        size="icon"
        variant="outline"
      >
        <ChevronDownIcon aria-hidden="true" size={16} />
      </Button>
    </div>
  );
}
