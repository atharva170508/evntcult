import { SquareArrowOutUpRightIcon } from "lucide-react";

import { Button } from "@/registry/default/ui/button";

export default function Component() {
  return (
    <div className="-space-x-px inline-flex rounded-md shadow-xs rtl:space-x-reverse">
      <Button
        className="rounded-none shadow-none first:rounded-s-md last:rounded-e-md focus-visible:z-10"
        variant="outline"
      >
        Preview
      </Button>
      <Button
        aria-label="Open link"
        className="rounded-none shadow-none first:rounded-s-md last:rounded-e-md focus-visible:z-10"
        size="icon"
        variant="outline"
      >
        <SquareArrowOutUpRightIcon aria-hidden="true" size={16} />
      </Button>
    </div>
  );
}
