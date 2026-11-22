"use client";

import { OTPInput, type SlotProps } from "input-otp";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/registry/default/lib/utils";
import { Button } from "@/registry/default/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/registry/default/ui/dialog";

const CORRECT_CODE = "6548";

export default function Component() {
  const [value, setValue] = useState("");
  const [hasGuessed, setHasGuessed] = useState<undefined | boolean>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (hasGuessed) {
      closeButtonRef.current?.focus();
    }
  }, [hasGuessed]);

  async function onSubmit(e?: React.FormEvent<HTMLFormElement>) {
    e?.preventDefault?.();

    inputRef.current?.select();
    await new Promise((r) => setTimeout(r, 1_00));

    setHasGuessed(value === CORRECT_CODE);

    setValue("");
    setTimeout(() => {
      inputRef.current?.blur();
    }, 20);
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">OTP code</Button>
      </DialogTrigger>
      <DialogContent>
        <div className="flex flex-col items-center gap-2">
          <div
            aria-hidden="true"
            className="flex size-11 shrink-0 items-center justify-center rounded-full border"
          >
            <svg
              aria-hidden="true"
              className="stroke-zinc-800 dark:stroke-zinc-100"
              height="20"
              viewBox="0 0 32 32"
              width="20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="16" cy="16" fill="none" r="12" strokeWidth="8" />
            </svg>
          </div>
          <DialogHeader>
            <DialogTitle className="sm:text-center">
              {hasGuessed ? "Code verified!" : "Enter confirmation code"}
            </DialogTitle>
            <DialogDescription className="sm:text-center">
              {hasGuessed
                ? "Your code has been successfully verified."
                : `Check your email and enter the code - Try ${CORRECT_CODE}`}
            </DialogDescription>
          </DialogHeader>
        </div>

        {hasGuessed ? (
          <div className="text-center">
            <DialogClose asChild>
              <Button ref={closeButtonRef} type="button">
                Close
              </Button>
            </DialogClose>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-center">
              <OTPInput
                containerClassName="flex items-center gap-3 has-disabled:opacity-50"
                id="cofirmation-code"
                maxLength={4}
                onChange={setValue}
                onComplete={onSubmit}
                onFocus={() => setHasGuessed(undefined)}
                ref={inputRef}
                render={({ slots }) => (
                  <div className="flex gap-2">
                    {slots.map((slot, idx) => (
                      <Slot key={String(idx)} {...slot} />
                    ))}
                  </div>
                )}
                value={value}
              />
            </div>
            {hasGuessed === false && (
              <p
                aria-live="polite"
                className="text-center text-muted-foreground text-xs"
                role="alert"
              >
                Invalid code. Please try again.
              </p>
            )}
            <p className="text-center text-sm">
              <a className="underline hover:no-underline" href="#">
                Resend code
              </a>
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Slot(props: SlotProps) {
  return (
    <div
      className={cn(
        "flex size-9 items-center justify-center rounded-md border border-input bg-background font-medium text-foreground shadow-xs transition-[color,box-shadow]",
        { "z-10 border-ring ring-[3px] ring-ring/50": props.isActive },
      )}
    >
      {props.char !== null && <div>{props.char}</div>}
    </div>
  );
}
