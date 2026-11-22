"use client";

import { CircleXIcon } from "lucide-react";
import { useId, useRef, useState } from "react";

import { Input } from "@/registry/default/ui/input";
import { Label } from "@/registry/default/ui/label";

export default function Component() {
  const id = useId();
  const [inputValue, setInputValue] = useState("Click to clear");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClearInput = () => {
    setInputValue("");
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="*:not-first:mt-2">
      <Label htmlFor={id}>Input with clear button</Label>
      <div className="relative">
        <Input
          className="pe-9"
          id={id}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type something..."
          ref={inputRef}
          type="text"
          value={inputValue}
        />
        {inputValue && (
          <button
            aria-label="Clear input"
            className="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-md text-muted-foreground/80 outline-none transition-[color,box-shadow] hover:text-foreground focus:z-10 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
            onClick={handleClearInput}
            type="button"
          >
            <CircleXIcon aria-hidden="true" size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
