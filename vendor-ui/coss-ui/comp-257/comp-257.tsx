"use client";

import { useState } from "react";

import { Label } from "@/registry/default/ui/label";
import { Slider } from "@/registry/default/ui/slider";

export default function Component() {
  const [value, setValue] = useState([3]);

  const emojis = ["😡", "🙁", "😐", "🙂", "😍"];
  const labels = ["Awful", "Poor", "Okay", "Good", "Amazing"];

  return (
    <div className="*:not-first:mt-3">
      <Label>Rate your experience</Label>
      <div className="flex items-center gap-2">
        <Slider
          aria-label="Rate your experience"
          max={5}
          min={1}
          onValueChange={setValue}
          showTooltip
          tooltipContent={(value) => labels[value - 1]}
          value={value}
        />
        <span className="text-2xl">{emojis[value[0] - 1]}</span>
      </div>
    </div>
  );
}
