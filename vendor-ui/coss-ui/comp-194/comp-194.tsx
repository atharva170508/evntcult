import { useId } from "react";

import { Label } from "@/registry/default/ui/label";
import { SelectNative } from "@/registry/default/ui/select-native";

export default function Component() {
  const id = useId();
  return (
    <div className="*:not-first:mt-2">
      <Label htmlFor={id}>Select with error (native)</Label>
      <SelectNative aria-invalid id={id}>
        <option value="1">React</option>
        <option value="2">Next.js</option>
        <option value="3">Astro</option>
        <option value="4">Gatsby</option>
      </SelectNative>
      <p
        aria-live="polite"
        className="mt-2 text-destructive text-xs"
        role="alert"
      >
        Selected option is invalid
      </p>
    </div>
  );
}
