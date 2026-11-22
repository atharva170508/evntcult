import { useId } from "react";

import { Label } from "@/registry/default/ui/label";
import { Textarea } from "@/registry/default/ui/textarea";

export default function Component() {
  const id = useId();
  return (
    <div className="group relative">
      <Label
        className="-translate-y-1/2 absolute start-1 top-0 z-10 block bg-background px-2 font-medium text-foreground text-xs group-has-disabled:opacity-50"
        htmlFor={id}
      >
        Textarea with overlapping label
      </Label>
      <Textarea id={id} />
    </div>
  );
}
