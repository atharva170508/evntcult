import { Brush, Eraser, Scissors, SwatchBook } from "lucide-react";
import { useId } from "react";

import { Label } from "@/registry/default/ui/label";
import { RadioGroup, RadioGroupItem } from "@/registry/default/ui/radio-group";

export default function Component() {
  const id = useId();

  const items = [
    { Icon: SwatchBook, label: "Palette", value: "1" },
    { Icon: Brush, label: "Brush", value: "2" },
    { Icon: Eraser, label: "Eraser", value: "3" },
    { Icon: Scissors, label: "Cut", value: "4" },
  ];

  return (
    <RadioGroup className="grid-cols-2" defaultValue="1">
      {items.map((item) => (
        <div
          className="relative flex flex-col gap-4 rounded-md border border-input p-4 shadow-xs outline-none has-data-[state=checked]:border-primary/50"
          key={`${id}-${item.value}`}
        >
          <div className="flex justify-between gap-2">
            <RadioGroupItem
              className="order-1 after:absolute after:inset-0"
              id={`${id}-${item.value}`}
              value={item.value}
            />
            <item.Icon aria-hidden="true" className="opacity-60" size={16} />
          </div>
          <Label htmlFor={`${id}-${item.value}`}>{item.label}</Label>
        </div>
      ))}
    </RadioGroup>
  );
}
