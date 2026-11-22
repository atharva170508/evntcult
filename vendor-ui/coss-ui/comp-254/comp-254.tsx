"use client";

import { RotateCcwIcon } from "lucide-react";

import { useSliderWithInput } from "@/registry/default/hooks/use-slider-with-input";
import { cn } from "@/registry/default/lib/utils";
import { Button } from "@/registry/default/ui/button";
import { Input } from "@/registry/default/ui/input";
import { Label } from "@/registry/default/ui/label";
import { Slider } from "@/registry/default/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/registry/default/ui/tooltip";

export default function Component() {
  const minValue = 0;
  const maxValue = 2;
  const initialValue = [1.25];
  const defaultValue = [1];

  const {
    sliderValue,
    inputValues,
    validateAndUpdateValue,
    handleInputChange,
    handleSliderChange,
    resetToDefault,
    showReset,
  } = useSliderWithInput({ defaultValue, initialValue, maxValue, minValue });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Label>Temperature</Label>
        <div className="flex items-center gap-1">
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  aria-label="Reset"
                  className={cn(
                    "size-7 transition-opacity",
                    showReset ? "opacity-100" : "opacity-0",
                  )}
                  onClick={resetToDefault}
                  size="icon"
                  variant="ghost"
                >
                  <RotateCcwIcon aria-hidden="true" size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="px-2 py-1 text-xs">
                Reset to default
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Input
            aria-label="Enter value"
            className="h-7 w-12 px-2 py-0"
            inputMode="decimal"
            onBlur={() => validateAndUpdateValue(inputValues[0] ?? "", 0)}
            onChange={(e) => handleInputChange(e, 0)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                validateAndUpdateValue(inputValues[0] ?? "", 0);
              }
            }}
            type="text"
            value={inputValues[0]}
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Slider
          aria-label="Temperature"
          className="grow"
          max={maxValue}
          min={minValue}
          onValueChange={handleSliderChange}
          step={0.01}
          value={sliderValue}
        />
      </div>
    </div>
  );
}
