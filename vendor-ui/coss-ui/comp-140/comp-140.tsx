import { useId } from "react";

import { Checkbox } from "@/registry/default/ui/checkbox";
import { Label } from "@/registry/default/ui/label";

export default function Component() {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-2">
      <Checkbox className="order-1" id={id} />
      <Label htmlFor={id}>Right aligned checkbox</Label>
    </div>
  );
}
