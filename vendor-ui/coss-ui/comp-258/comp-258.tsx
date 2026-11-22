"use client";

import { useSliderWithInput } from "@/registry/default/hooks/use-slider-with-input";
import { Input } from "@/registry/default/ui/input";
import { Label } from "@/registry/default/ui/label";
import { Slider } from "@/registry/default/ui/slider";

export default function Component() {
  const minValue = 0;
  const maxValue = 200;
  const initialValue = [50, 150];

  const {
    sliderValue,
    inputValues,
    validateAndUpdateValue,
    handleInputChange,
    handleSliderChange,
  } = useSliderWithInput({ initialValue, maxValue, minValue });

  return (
    <div className="*:not-first:mt-3">
      <Label>Dual range slider with input</Label>
      <div className="flex items-center gap-4">
        <Input
          aria-label="Enter minimum value"
          className="h-8 w-12 px-2 py-1"
          inputMode="decimal"
          onBlur={() => validateAndUpdateValue(inputValues[0], 0)}
          onChange={(e) => handleInputChange(e, 0)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              validateAndUpdateValue(inputValues[0], 0);
            }
          }}
          type="text"
          value={inputValues[0]}
        />
        <Slider
          aria-label="Dual range slider with input"
          className="grow"
          max={maxValue}
          min={minValue}
          onValueChange={handleSliderChange}
          value={sliderValue}
        />
        <Input
          aria-label="Enter maximum value"
          className="h-8 w-12 px-2 py-1"
          inputMode="decimal"
          onBlur={() => validateAndUpdateValue(inputValues[1], 1)}
          onChange={(e) => handleInputChange(e, 1)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              validateAndUpdateValue(inputValues[1], 1);
            }
          }}
          type="text"
          value={inputValues[1]}
        />
      </div>
    </div>
  );
}
