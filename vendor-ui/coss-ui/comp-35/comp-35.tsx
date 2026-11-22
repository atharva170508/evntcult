"use client";

import { useId } from "react";

import { useCharacterLimit } from "@/registry/default/hooks/use-character-limit";
import { Input } from "@/registry/default/ui/input";
import { Label } from "@/registry/default/ui/label";

export default function Component() {
  const id = useId();
  const maxLength = 8;
  const {
    value,
    characterCount,
    handleChange,
    maxLength: limit,
  } = useCharacterLimit({ maxLength });

  return (
    <div className="*:not-first:mt-2">
      <Label htmlFor={id}>Input with characters left</Label>
      <Input
        aria-describedby={`${id}-description`}
        id={id}
        maxLength={maxLength}
        onChange={handleChange}
        type="text"
        value={value}
      />
      <p
        aria-live="polite"
        className="mt-2 text-muted-foreground text-xs"
        id={`${id}-description`}
        role="status"
      >
        <span className="tabular-nums">{limit - characterCount}</span>{" "}
        characters left
      </p>
    </div>
  );
}
