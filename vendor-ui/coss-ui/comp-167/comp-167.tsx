import { useId } from "react";

import { RadioGroup, RadioGroupItem } from "@/registry/default/ui/radio-group";

export default function Component() {
  const id = useId();

  const items = [
    { icon: "😠", label: "Angry", value: "1" },
    { icon: "🙁", label: "Sad", value: "2" },
    { icon: "😐", label: "Neutral", value: "3" },
    { icon: "🙂", label: "Happy", value: "4" },
    { icon: "😀", label: "Laughing", value: "5" },
  ];

  return (
    <fieldset className="space-y-4">
      <legend className="font-medium text-foreground text-sm leading-none">
        How did it go?
      </legend>
      <RadioGroup className="flex gap-1.5" defaultValue="3">
        {items.map((item) => (
          <label
            className="relative flex size-9 cursor-pointer flex-col items-center justify-center rounded-full border border-input text-center text-xl shadow-xs outline-none transition-[color,box-shadow] has-data-disabled:cursor-not-allowed has-data-[state=checked]:border-primary/50 has-focus-visible:border-ring has-data-disabled:opacity-50 has-focus-visible:ring-[3px] has-focus-visible:ring-ring/50"
            key={`${id}-${item.value}`}
          >
            <RadioGroupItem
              className="sr-only after:absolute after:inset-0"
              id={`${id}-${item.value}`}
              value={item.value}
            />
            {item.icon}
          </label>
        ))}
      </RadioGroup>
    </fieldset>
  );
}
