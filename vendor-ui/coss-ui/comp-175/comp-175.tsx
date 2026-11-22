import { useId } from "react";

import { Label } from "@/registry/default/ui/label";
import { Switch } from "@/registry/default/ui/switch";

export default function Component() {
  const id = useId();
  return (
    <div className="inline-flex items-center gap-2">
      <Switch disabled id={id} />
      <Label className="sr-only" htmlFor={id}>
        Disabled
      </Label>
    </div>
  );
}
