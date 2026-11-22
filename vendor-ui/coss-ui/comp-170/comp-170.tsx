"use client";

import { useId, useState } from "react";

import { RadioGroup, RadioGroupItem } from "@/registry/default/ui/radio-group";

export default function Component() {
  const id = useId();
  const [selectedValue, setSelectedValue] = useState("on");

  return (
    <div className="inline-flex h-9 rounded-md bg-input/50 p-0.5">
      <RadioGroup
        className="group relative inline-grid grid-cols-[1fr_1fr] items-center gap-0 font-medium text-sm after:absolute after:inset-y-0 after:w-1/2 after:rounded-sm after:bg-background after:shadow-xs after:transition-[translate,box-shadow] after:duration-300 after:ease-[cubic-bezier(0.16,1,0.3,1)] has-focus-visible:after:border-ring has-focus-visible:after:ring-[3px] has-focus-visible:after:ring-ring/50 data-[state=off]:after:translate-x-0 data-[state=on]:after:translate-x-full"
        data-state={selectedValue}
        onValueChange={setSelectedValue}
        value={selectedValue}
      >
        <label className="relative z-10 inline-flex h-full min-w-8 cursor-pointer select-none items-center justify-center whitespace-nowrap px-4 transition-colors group-data-[state=on]:text-muted-foreground/70">
          Bill Monthly
          <RadioGroupItem className="sr-only" id={`${id}-1`} value="off" />
        </label>
        <label className="relative z-10 inline-flex h-full min-w-8 cursor-pointer select-none items-center justify-center whitespace-nowrap px-4 transition-colors group-data-[state=off]:text-muted-foreground/70">
          <span>
            Bill Yearly{" "}
            <span className="transition-colors group-data-[state=off]:text-muted-foreground/70 group-data-[state=on]:text-emerald-500">
              -20%
            </span>
          </span>
          <RadioGroupItem className="sr-only" id={`${id}-2`} value="on" />
        </label>
      </RadioGroup>
    </div>
  );
}
