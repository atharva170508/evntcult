import { useId } from "react";

import { Label } from "@/registry/default/ui/label";
import { Switch } from "@/registry/default/ui/switch";

export default function Component() {
  const id = useId();
  return (
    <div className="inline-flex items-center gap-2">
      <Switch
        className="h-3 w-9 border-none outline-offset-[6px] [&_span]:border [&_span]:border-input"
        id={id}
      />
      <Label className="sr-only" htmlFor={id}>
        M2-style switch
      </Label>
    </div>
  );
}
