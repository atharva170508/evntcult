import { useId } from "react";

import { Label } from "@/registry/default/ui/label";
import { RadioGroup, RadioGroupItem } from "@/registry/default/ui/radio-group";

export default function Component() {
  const id = useId();
  return (
    <RadioGroup defaultValue="1">
      <div className="flex items-center gap-2">
        <RadioGroupItem id={`${id}-1`} value="1" />
        <Label htmlFor={`${id}-1`}>Option 1</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem id={`${id}-2`} value="2" />
        <Label htmlFor={`${id}-2`}>Option 2</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem id={`${id}-3`} value="3" />
        <Label htmlFor={`${id}-3`}>Option 3</Label>
      </div>
    </RadioGroup>
  );
}
