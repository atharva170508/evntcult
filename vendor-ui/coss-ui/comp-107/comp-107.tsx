"use client";

import {
  AlignCenterIcon,
  AlignJustifyIcon,
  AlignLeftIcon,
  AlignRightIcon,
} from "lucide-react";
import { useState } from "react";

import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/registry/default/ui/toggle-group";

export default function Component() {
  const [value, setValue] = useState<string>("center");

  return (
    <ToggleGroup
      className="inline-flex divide-x divide-background"
      onValueChange={(value) => {
        if (value) setValue(value);
      }}
      type="single"
      value={value}
    >
      <ToggleGroupItem
        aria-label="Align Left"
        className="bg-primary/80 text-primary-foreground hover:bg-primary hover:text-primary-foreground data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
        value="left"
      >
        <AlignLeftIcon aria-hidden="true" size={16} />
      </ToggleGroupItem>
      <ToggleGroupItem
        aria-label="Align Center"
        className="bg-primary/80 text-primary-foreground hover:bg-primary hover:text-primary-foreground data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
        value="center"
      >
        <AlignCenterIcon aria-hidden="true" size={16} />
      </ToggleGroupItem>
      <ToggleGroupItem
        aria-label="Align Right"
        className="bg-primary/80 text-primary-foreground hover:bg-primary hover:text-primary-foreground data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
        value="right"
      >
        <AlignRightIcon aria-hidden="true" size={16} />
      </ToggleGroupItem>
      <ToggleGroupItem
        aria-label="Align Justify"
        className="bg-primary/80 text-primary-foreground hover:bg-primary hover:text-primary-foreground data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
        value="justify"
      >
        <AlignJustifyIcon aria-hidden="true" size={16} />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
