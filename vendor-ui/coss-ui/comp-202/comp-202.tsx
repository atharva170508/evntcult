import { useId } from "react";

import { SelectNative } from "@/registry/default/ui/select-native";

export default function Component() {
  const id = useId();
  return (
    <div className="relative rounded-md border border-input bg-background shadow-xs outline-none transition-[color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50 has-[select:is(:disabled)_*]:pointer-events-none has-[select:disabled]:cursor-not-allowed has-aria-invalid:border-destructive has-[select:disabled]:opacity-50 has-aria-invalid:ring-destructive/20 dark:has-aria-invalid:ring-destructive/40">
      <label
        className="block px-3 pt-2 font-medium text-foreground text-xs"
        htmlFor={id}
      >
        Select with inset label (native)
      </label>
      <SelectNative
        className="border-none bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
        defaultValue=""
        id={id}
      >
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
