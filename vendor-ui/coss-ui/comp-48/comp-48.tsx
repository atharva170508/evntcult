"use client";

import { useId } from "react";
import { usePaymentInputs } from "react-payment-inputs";

import { Input } from "@/registry/default/ui/input";
import { Label } from "@/registry/default/ui/label";

export default function Component() {
  const id = useId();
  const { getExpiryDateProps } = usePaymentInputs();

  return (
    <div className="*:not-first:mt-2">
      <Label htmlFor={`expiry-${id}`}>Expiry date</Label>
      <Input
        {...getExpiryDateProps()}
        className="[direction:inherit]"
        id={`expiry-${id}`}
      />
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
