import { useId } from "react";

import { Input } from "@/registry/default/ui/input";
import { Label } from "@/registry/default/ui/label";

export default function Component() {
  const id = useId();
  return (
    <div className="*:not-first:mt-2">
      <div className="flex items-center justify-between gap-2">
        <Label className="leading-6" htmlFor={id}>
          Input with hint
        </Label>
        <span className="text-muted-foreground text-sm">Optional</span>
      </div>
      <Input id={id} placeholder="Email" type="email" />
    </div>
  );
}
