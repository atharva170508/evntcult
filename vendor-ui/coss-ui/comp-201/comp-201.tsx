import { useId } from "react";

import { SelectNative } from "@/registry/default/ui/select-native";

export default function Component() {
  const id = useId();
  return (
    <div className="group relative">
      <label
        className="-translate-y-1/2 absolute start-1 top-0 z-10 block bg-background px-2 font-medium text-foreground text-xs group-has-[select:disabled]:opacity-50"
        htmlFor={id}
      >
        Select with overlapping label (native)
      </label>
      <SelectNative defaultValue="" id={id}>
        <option disabled value="">
          Select framework
        </option>
        <option value="1">React</option>
        <option value="2">Next.js</option>
        <option value="3">Astro</option>
        <option value="4">Gatsby</option>
      </SelectNative>
    </div>
  );
}
