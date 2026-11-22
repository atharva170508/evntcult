import { useId } from "react";

import { RadioGroup, RadioGroupItem } from "@/registry/default/ui/radio-group";

export default function Component() {
  const id = useId();
  return (
    <>
      <fieldset className="space-y-4">
        <legend className="font-medium text-foreground text-sm leading-none">
          How likely are you to recommend us?
        </legend>
        <RadioGroup className="-space-x-px flex gap-0 rounded-md shadow-xs">
          {["0", "1", "2", "3", "4", "5"].map((value) => (
            <label
              className="relative flex size-9 flex-1 cursor-pointer flex-col items-center justify-center gap-3 border border-input text-center font-medium text-sm outline-none transition-[color,box-shadow] first:rounded-s-md last:rounded-e-md has-data-[state=checked]:z-10 has-data-disabled:cursor-not-allowed has-data-[state=checked]:border-primary/50 has-focus-visible:border-ring has-data-disabled:opacity-50 has-focus-visible:ring-[3px] has-focus-visible:ring-ring/50"
              key={value}
            >
              <RadioGroupItem
                className="sr-only after:absolute after:inset-0"
                id={`${id}-${value}`}
                value={value}
              />
              {value}
            </label>
          ))}
        </RadioGroup>
      </fieldset>
      <div className="mt-1 flex justify-between font-medium text-xs">
        <p>
          <span className="text-base">😡</span> Not likely
        </p>
        <p>
          Very Likely <span className="text-base">😍</span>
        </p>
      </div>
    </>
  );
}
