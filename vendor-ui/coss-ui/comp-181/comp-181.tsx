"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { useId, useState } from "react";

import { Label } from "@/registry/default/ui/label";
import { Switch } from "@/registry/default/ui/switch";

export default function Component() {
  const id = useId();
  const [checked, setChecked] = useState<boolean>(true);

  return (
    <div className="inline-flex items-center gap-2">
      <Switch
        aria-label="Toggle switch"
        checked={checked}
        id={id}
        onCheckedChange={setChecked}
      />
      <Label htmlFor={id}>
        <span className="sr-only">Toggle switch</span>
        {checked ? (
          <SunIcon aria-hidden="true" size={16} />
        ) : (
          <MoonIcon aria-hidden="true" size={16} />
        )}
      </Label>
    </div>
  );
}
