import { useId } from "react";

import { Label } from "@/registry/default/ui/label";
import { Switch } from "@/registry/default/ui/switch";

export default function Component() {
  const id = useId();
  return (
    <div className="inline-flex items-center gap-2">
      <Switch
        className="data-[state=checked]:[&_span]:rtl:-translate-x-3 h-5 w-8 [&_span]:size-4 data-[state=checked]:[&_span]:translate-x-3"
        id={id}
      />
      <Label className="sr-only" htmlFor={id}>
        Small switch
      </Label>
    </div>
  );
}
