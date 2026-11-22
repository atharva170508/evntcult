import { ThumbsUpIcon } from "lucide-react";

import { Button } from "@/registry/default/ui/button";

export default function Component() {
  return (
    <Button className="py-0 pe-0" variant="outline">
      <ThumbsUpIcon aria-hidden="true" className="opacity-60" size={16} />
      Like
      <span className="relative ms-1 inline-flex h-full items-center justify-center rounded-full px-3 font-medium text-muted-foreground text-xs before:absolute before:inset-0 before:left-0 before:w-px before:bg-input">
        86
      </span>
    </Button>
  );
}
