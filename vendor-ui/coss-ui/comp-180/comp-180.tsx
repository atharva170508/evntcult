"use client";

import { useId, useState } from "react";

import { Switch } from "@/registry/default/ui/switch";

export default function Component() {
  const id = useId();
  const [checked, setChecked] = useState(false);

  const toggleSwitch = () => setChecked((prev) => !prev);

  return (
    <div
      className="group inline-flex items-center gap-2"
      data-state={checked ? "checked" : "unchecked"}
    >
      <span
        aria-controls={id}
        className="flex-1 cursor-pointer text-right font-medium text-sm group-data-[state=checked]:text-muted-foreground/70"
        id={`${id}-off`}
        onClick={() => setChecked(false)}
      >
        Off
      </span>
      <Switch
        aria-labelledby={`${id}-off ${id}-on`}
        checked={checked}
        id={id}
        onCheckedChange={toggleSwitch}
      />
      <span
        aria-controls={id}
        className="flex-1 cursor-pointer text-left font-medium text-sm group-data-[state=unchecked]:text-muted-foreground/70"
        id={`${id}-on`}
        onClick={() => setChecked(true)}
      >
        On
      </span>
    </div>
  );
}
