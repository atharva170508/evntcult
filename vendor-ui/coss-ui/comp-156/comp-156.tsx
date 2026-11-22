"use client";

import { useEffect, useId, useRef, useState } from "react";

import { Input } from "@/registry/default/ui/input";
import { Label } from "@/registry/default/ui/label";
import { RadioGroup, RadioGroupItem } from "@/registry/default/ui/radio-group";

export default function Component() {
  const radioId = useId();
  const inputId = useId();
  const [selectedValue, setSelectedValue] = useState("without-expansion");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectedValue === "with-expansion" && inputRef.current) {
      inputRef.current.focus();
    }
  }, [selectedValue]);

  return (
    <RadioGroup
      className="gap-6"
      onValueChange={setSelectedValue}
      value={selectedValue}
    >
      <div>
        <div className="flex items-start gap-2">
          <RadioGroupItem
            aria-controls={inputId}
            aria-describedby={`${radioId}-1-description`}
            id={`${radioId}-1`}
            value="with-expansion"
          />
          <div className="grow">
            <div className="grid grow gap-2">
              <Label htmlFor={`${radioId}-1`}>Radio with expansion</Label>
              <p
                className="text-muted-foreground text-xs"
                id={`${radioId}-1-description`}
              >
                You can use this radio with a label and a description.
              </p>
            </div>
            {/* Expandable field */}
            <div
              aria-labelledby={`${radioId}-1`}
              className="grid transition-all ease-in-out data-[state=collapsed]:grid-rows-[0fr] data-[state=expanded]:grid-rows-[1fr] data-[state=collapsed]:opacity-0 data-[state=expanded]:opacity-100"
              data-state={
                selectedValue === "with-expansion" ? "expanded" : "collapsed"
              }
              id={inputId}
              role="region"
            >
              <div className="-m-2 pointer-events-none overflow-hidden p-2">
                <div className="pointer-events-auto mt-3">
                  <Input
                    aria-label="Additional Information"
                    disabled={selectedValue !== "with-expansion"}
                    id="radio-05-additional-info"
                    placeholder="Enter details"
                    ref={inputRef}
                    type="text"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-start gap-2">
        <RadioGroupItem
          aria-describedby={`${radioId}-2-description`}
          id={`${radioId}-2`}
          value="without-expansion"
        />
        <div className="grid grow gap-2">
          <Label htmlFor={`${radioId}-2`}>Radio without expansion</Label>
          <p
            className="text-muted-foreground text-xs"
            id={`${radioId}-2-description`}
          >
            You can use this checkbox with a label and a description.
          </p>
        </div>
      </div>
    </RadioGroup>
  );
}
