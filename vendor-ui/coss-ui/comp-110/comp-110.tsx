"use client";

import { useState } from "react";

import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/registry/default/ui/toggle-group";

export default function Component() {
  const [value, setValue] = useState<string>("left");

  return (
    <ToggleGroup
      onValueChange={(value) => {
        if (value) setValue(value);
      }}
      type="single"
      value={value}
      variant="outline"
    >
      <ToggleGroupItem className="flex-1" value="left">
        Left
      </ToggleGroupItem>
      <ToggleGroupItem className="flex-1" value="center">
        Center
      </ToggleGroupItem>
      <ToggleGroupItem className="flex-1" value="right">
        Right
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
