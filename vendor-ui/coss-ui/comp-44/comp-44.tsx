"use client";

import { OTPInput, type SlotProps } from "input-otp";
import { useId } from "react";

import { cn } from "@/registry/default/lib/utils";
import { Label } from "@/registry/default/ui/label";

export default function Component() {
  const id = useId();
  return (
    <div className="*:not-first:mt-2">
      <Label htmlFor={id}>OTP input single</Label>
      <OTPInput
        containerClassName="flex items-center gap-3 has-disabled:opacity-50"
        id={id}
        maxLength={4}
        render={({ slots }) => (
          <div className="flex">
            {slots.map((slot, idx) => (
              <Slot key={String(idx)} {...slot} />
            ))}
          </div>
        )}
      />
      <p
        aria-live="polite"
        className="mt-2 text-muted-foreground text-xs"
        role="region"
      >
        Built with{" "}
        <a
          className="underline hover:text-foreground"
          href="https://github.com/guilhermerodz/input-otp"
          rel="noreferrer noopener nofollow"
          target="_blank"
        >
          Input OTP
        </a>
      </p>
    </div>
  );
}

function Slot(props: SlotProps) {
  return (
    <div
      className={cn(
        "-ms-px relative flex size-9 items-center justify-center border border-input bg-background font-medium text-foreground shadow-xs transition-[color,box-shadow] first:ms-0 first:rounded-s-md last:rounded-e-md",
        { "z-10 border-ring ring-[3px] ring-ring/50": props.isActive },
      )}
    >
      {props.char !== null && <div>{props.char}</div>}
    </div>
  );
}
