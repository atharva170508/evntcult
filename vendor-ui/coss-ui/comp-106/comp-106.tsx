import { FlipHorizontalIcon, FlipVerticalIcon } from "lucide-react";

import { Button } from "@/registry/default/ui/button";

export default function Component() {
  return (
    <div className="-space-x-px inline-flex rounded-md shadow-xs rtl:space-x-reverse">
      <Button
        aria-label="Flip Horizontal"
        className="rounded-none shadow-none first:rounded-s-md last:rounded-e-md focus-visible:z-10"
        size="icon"
        variant="outline"
      >
        <FlipHorizontalIcon aria-hidden="true" size={16} />
      </Button>
      <Button
        aria-label="Flip Vertical"
        className="rounded-none shadow-none first:rounded-s-md last:rounded-e-md focus-visible:z-10"
        size="icon"
        variant="outline"
      >
        <FlipVerticalIcon aria-hidden="true" size={16} />
      </Button>
    </div>
  );
}
