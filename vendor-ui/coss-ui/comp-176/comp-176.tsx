import { useId } from "react";

import { Label } from "@/registry/default/ui/label";
import { Switch } from "@/registry/default/ui/switch";

export default function Component() {
  const id = useId();
  return (
    <div className="inline-flex items-center gap-2">
      <Switch className="rounded-sm [&_span]:rounded" id={id} />
      <Label className="sr-only" htmlFor={id}>
        Square switch
      </Label>
    </div>
  );
}
