import { useId } from "react";

import { Badge } from "@/registry/default/ui/badge";
import { Label } from "@/registry/default/ui/label";
import { RadioGroup, RadioGroupItem } from "@/registry/default/ui/radio-group";

export default function Component() {
  const id = useId();

  const items = [
    { label: "Hobby", price: "$9/mo", value: "1" },
    { label: "Plus", price: "$29/mo", value: "2" },
    { label: "Team", price: "$49/mo", value: "3" },
    { label: "Enterprise", price: "Custom", value: "4" },
  ];

  return (
    <fieldset className="space-y-4">
      <legend className="font-medium text-foreground text-sm leading-none">
        Choose plan
      </legend>
      <RadioGroup
        className="-space-y-px gap-0 rounded-md shadow-xs"
        defaultValue="2"
      >
        {items.map((item) => (
          <div
            className="relative flex flex-col gap-4 border border-input p-4 outline-none first:rounded-t-md last:rounded-b-md has-data-[state=checked]:z-10 has-data-[state=checked]:border-primary/50 has-data-[state=checked]:bg-accent"
            key={`${id}-${item.value}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RadioGroupItem
                  aria-describedby={`${`${id}-${item.value}`}-price`}
                  className="after:absolute after:inset-0"
                  id={`${id}-${item.value}`}
                  value={item.value}
                />
                <Label
                  className="inline-flex items-start"
                  htmlFor={`${id}-${item.value}`}
                >
                  {item.label}
                  {item.value === "2" && (
                    <Badge className="-mt-1 ms-2">Popular</Badge>
                  )}
                </Label>
              </div>
              <div
                className="text-muted-foreground text-xs leading-[inherit]"
                id={`${`${id}-${item.value}`}-price`}
              >
                {item.price}
              </div>
            </div>
          </div>
        ))}
      </RadioGroup>
    </fieldset>
  );
}
