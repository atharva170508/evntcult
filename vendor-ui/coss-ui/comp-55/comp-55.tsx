"use client";

import { useId } from "react";
import { withMask } from "use-mask-input";

import { Input } from "@/registry/default/ui/input";
import { Label } from "@/registry/default/ui/label";

export default function Component() {
  const id = useId();
  return (
    <div className="*:not-first:mt-2">
      <Label htmlFor={id}>Timestamp</Label>
      <Input
        id={id}
        placeholder="00:00:00"
        ref={(input) => {
          if (input) {
            withMask("99:99:99", {
              placeholder: "-",
              showMaskOnHover: false,
            })(input);
          }
        }}
        type="text"
      />
      <p
        aria-live="polite"
        className="mt-2 text-muted-foreground text-xs"
        role="region"
      >
        Built with{" "}
        <a
          className="underline hover:text-foreground"
          href="https://github.com/eduardoborges/use-mask-input"
          rel="noreferrer noopener nofollow"
          target="_blank"
        >
          use-mask-input
        </a>
      </p>
    </div>
  );
}
