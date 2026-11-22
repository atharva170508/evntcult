"use client";

import { RotateCcwIcon } from "lucide-react";
import React, { useRef } from "react";

import { useSliderWithInput } from "@/registry/default/hooks/use-slider-with-input";
import { Button } from "@/registry/default/ui/button";
import { Input } from "@/registry/default/ui/input";
import { Label } from "@/registry/default/ui/label";
import { Slider } from "@/registry/default/ui/slider";

export default function Component() {
  // Create refs to store reset functions
  const resetFunctionsRef = useRef<(() => void)[]>([]);

  // Function to reset all sliders to default
  const resetAll = () => {
    for (const resetFn of resetFunctionsRef.current) {
      resetFn();
    }
  };

  // Function to register reset functions
  const registerResetFunction = (resetFn: () => void, index: number) => {
    resetFunctionsRef.current[index] = resetFn;
  };

  return (
    <div className="space-y-4">
      <legend className="font-medium text-foreground text-sm">
        Object position
      </legend>
      <div className="space-y-2">
        <SliderWithInput
          defaultValue={[0]}
          initialValue={[-2]}
          label="X"
          maxValue={10}
          minValue={-10}
          onRegisterReset={(resetFn) => registerResetFunction(resetFn, 0)}
        />
        <SliderWithInput
          defaultValue={[0]}
          initialValue={[4]}
          label="Y"
          maxValue={10}
          minValue={-10}
          onRegisterReset={(resetFn) => registerResetFunction(resetFn, 1)}
        />
        <SliderWithInput
          defaultValue={[0]}
          initialValue={[2]}
          label="Z"
          maxValue={10}
          minValue={-10}
          onRegisterReset={(resetFn) => registerResetFunction(resetFn, 2)}
        />
      </div>
      <Button className="w-full" onClick={resetAll} variant="outline">
        <RotateCcwIcon
          aria-hidden="true"
          className="-ms-1 opacity-60"
          size={16}
        />
        Reset
      </Button>
    </div>
  );
}

function SliderWithInput({
  minValue,
  maxValue,
  initialValue,
  defaultValue,
  label,
  onRegisterReset,
}: {
  minValue: number;
  maxValue: number;
  initialValue: number[];
  defaultValue: number[];
  label: string;
  onRegisterReset: (resetFn: () => void) => void;
}) {
  const {
    sliderValue,
    inputValues,
    validateAndUpdateValue,
    handleInputChange,
    handleSliderChange,
    resetToDefault,
  } = useSliderWithInput({ defaultValue, initialValue, maxValue, minValue });

  // Register the reset function when the component mounts
  React.useEffect(() => {
    onRegisterReset(resetToDefault);
  }, [onRegisterReset, resetToDefault]);

  return (
    <div className="flex items-center gap-2">
      <Label className="text-muted-foreground text-xs">{label}</Label>
      <Slider
        aria-label={label}
        className="grow [&>:last-child>span]:rounded"
        max={maxValue}
        min={minValue}
        onValueChange={handleSliderChange}
        value={sliderValue}
      />
      <Input
        aria-label="Enter value"
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
    </div>
  );
}
