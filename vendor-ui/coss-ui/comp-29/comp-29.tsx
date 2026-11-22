"use client";

import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import {
  Button,
  Group,
  Input,
  Label,
  NumberField,
} from "react-aria-components";

export default function Component() {
  return (
    <NumberField
      defaultValue={99}
      formatOptions={{
        currency: "EUR",
        currencySign: "accounting",
        style: "currency",
      }}
    >
      <div className="*:not-first:mt-2">
        <Label className="font-medium text-foreground text-sm">
          Number input with chevrons
        </Label>
        <Group className="relative inline-flex h-9 w-full items-center overflow-hidden whitespace-nowrap rounded-md border border-input text-sm shadow-xs outline-none transition-[color,box-shadow] data-focus-within:border-ring data-disabled:opacity-50 data-focus-within:ring-[3px] data-focus-within:ring-ring/50 data-focus-within:has-aria-invalid:border-destructive data-focus-within:has-aria-invalid:ring-destructive/20 dark:data-focus-within:has-aria-invalid:ring-destructive/40">
          <Input className="flex-1 bg-background px-3 py-2 text-foreground tabular-nums" />
          <div className="flex h-[calc(100%+2px)] flex-col">
            <Button
              className="-me-px flex h-1/2 w-6 flex-1 items-center justify-center border border-input bg-background text-muted-foreground/80 text-sm transition-[color,box-shadow] hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
              slot="increment"
            >
              <ChevronUpIcon aria-hidden="true" size={12} />
            </Button>
            <Button
              className="-me-px -mt-px flex h-1/2 w-6 flex-1 items-center justify-center border border-input bg-background text-muted-foreground/80 text-sm transition-[color,box-shadow] hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
              slot="decrement"
            >
              <ChevronDownIcon aria-hidden="true" size={12} />
            </Button>
          </div>
        </Group>
      </div>
      <p
        aria-live="polite"
        className="mt-2 text-muted-foreground text-xs"
        role="region"
      >
        Built with{" "}
        <a
          className="underline hover:text-foreground"
          href="https://react-spectrum.adobe.com/react-aria/NumberField.html"
          rel="noreferrer noopener nofollow"
          target="_blank"
        >
          React Aria
        </a>
      </p>
    </NumberField>
  );
}
