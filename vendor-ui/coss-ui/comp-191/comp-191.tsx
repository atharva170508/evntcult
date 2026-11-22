import { ClockIcon } from "lucide-react";
import { useId } from "react";

import { Label } from "@/registry/default/ui/label";
import { SelectNative } from "@/registry/default/ui/select-native";

export default function Component() {
  const id = useId();
  return (
    <div className="*:not-first:mt-2">
      <Label htmlFor={id}>Select with icon (native)</Label>
      <div className="group relative">
        <SelectNative className="ps-9" id={id}>
          <option value="1">00:00 AM - 11:59 PM</option>
          <option value="2">01:00 AM - 12:59 PM</option>
          <option value="3">02:00 AM - 01:59 PM</option>
          <option value="4">03:00 AM - 02:59 PM</option>
        </SelectNative>
        <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80 group-has-[select[disabled]]:opacity-50">
          <ClockIcon aria-hidden="true" size={16} />
        </div>
      </div>
    </div>
  );
}
