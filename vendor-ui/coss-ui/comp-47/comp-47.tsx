"use client";

import { CreditCardIcon } from "lucide-react";
import { useId } from "react";
import { usePaymentInputs } from "react-payment-inputs";

import { Input } from "@/registry/default/ui/input";
import { Label } from "@/registry/default/ui/label";

export default function Component() {
  const id = useId();
  const { getCardNumberProps } = usePaymentInputs();

  return (
    <div className="*:not-first:mt-2">
      <Label htmlFor={`number-${id}`}>Card Number</Label>
      <div className="relative">
        <Input
          {...getCardNumberProps()}
          className="peer ps-9 [direction:inherit]"
          id={`number-${id}`}
        />
        <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
          <CreditCardIcon aria-hidden="true" size={16} />
        </div>
      </div>
      <p
        aria-live="polite"
        className="mt-2 text-muted-foreground text-xs"
        role="region"
      >
        Built with{" "}
        <a
          className="underline hover:text-foreground"
          href="https://github.com/medipass/react-payment-inputs"
          rel="noreferrer noopener nofollow"
          target="_blank"
        >
          React Payment Inputs
        </a>
      </p>
    </div>
  );
}
