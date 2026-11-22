import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  CircleIcon,
} from "lucide-react";

import { Button } from "@/registry/default/ui/button";

export default function Component() {
  return (
    <div className="inline-grid w-fit grid-cols-3 gap-1">
      <Button
        aria-label="Pan camera up"
        className="col-start-2"
        size="icon"
        variant="outline"
      >
        <ChevronUpIcon aria-hidden="true" size={16} />
      </Button>
      <Button
        aria-label="Pan camera left"
        className="col-start-1"
        size="icon"
        variant="outline"
      >
        <ChevronLeftIcon aria-hidden="true" size={16} />
      </Button>
      <div aria-hidden="true" className="flex items-center justify-center">
        <CircleIcon className="opacity-60" size={16} />
      </div>
      <Button aria-label="Pan camera right" size="icon" variant="outline">
        <ChevronRightIcon aria-hidden="true" size={16} />
      </Button>
      <Button
        aria-label="Pan camera down"
        className="col-start-2"
        size="icon"
        variant="outline"
      >
        <ChevronDownIcon aria-hidden="true" size={16} />
      </Button>
    </div>
  );
}
