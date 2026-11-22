import { useId } from "react";

import { Label } from "@/registry/default/ui/label";
import { RadioGroup, RadioGroupItem } from "@/registry/default/ui/radio-group";

export default function Component() {
  const id = useId();

  const items = [
    { label: "USA", value: "1" },
    { label: "UK", value: "2" },
    { label: "France", value: "3" },
  ];

  return (
    <fieldset className="space-y-4">
      <legend className="font-medium text-foreground text-sm leading-none">
        Server location
      </legend>
      <RadioGroup className="flex flex-wrap gap-2" defaultValue="1">
        {items.map((item) => (
          <div
            className="relative flex flex-col items-start gap-4 rounded-md border border-input p-3 shadow-xs outline-none has-data-[state=checked]:border-primary/50"
            key={`${id}-${item.value}`}
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem
                className="after:absolute after:inset-0"
                id={`${id}-${item.value}`}
                value={item.value}
              />
              <Label htmlFor={`${id}-${item.value}`}>{item.label}</Label>
            </div>
          </div>
        ))}
      </RadioGroup>
    </fieldset>
  );
}
