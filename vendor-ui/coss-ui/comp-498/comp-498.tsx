"use client";

import { useState } from "react";
import type { DropdownNavProps, DropdownProps } from "react-day-picker";

import { Calendar } from "@/registry/default/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/registry/default/ui/select";

export default function Component() {
  const [date, setDate] = useState<Date | undefined>(new Date());

  const handleCalendarChange = (
    _value: string | number,
    _e: React.ChangeEventHandler<HTMLSelectElement>,
  ) => {
    const _event = {
      target: {
        value: String(_value),
      },
    } as React.ChangeEvent<HTMLSelectElement>;
    _e(_event);
  };

  return (
    <div>
      <Calendar
        captionLayout="dropdown-years"
        className="rounded-md border p-2"
        components={{
          DropdownNav: (props: DropdownNavProps) => {
            return (
              <div className="flex w-full items-center justify-center gap-3 [&>span]:font-medium [&>span]:text-sm">
                {props.children}
              </div>
            );
          },
          YearsDropdown: (props: DropdownProps) => {
            return (
              <Select
                onValueChange={(value) => {
                  if (props.onChange) {
                    handleCalendarChange(value, props.onChange);
                  }
                }}
                value={String(props.value)}
              >
                <SelectTrigger className="h-8 w-fit font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[min(26rem,var(--radix-select-content-available-height))]">
                  {props.options?.map((option) => (
                    <SelectItem
                      disabled={option.disabled}
                      key={option.value}
                      value={String(option.value)}
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            );
          },
        }}
        defaultMonth={new Date()}
        mode="single"
        onSelect={setDate}
        selected={date}
        startMonth={new Date(1980, 6)}
      />
      <p
        aria-live="polite"
        className="mt-4 text-center text-muted-foreground text-xs"
        role="region"
      >
        Yearly select + nav -{" "}
        <a
          className="underline hover:text-foreground"
          href="https://daypicker.dev/"
          rel="noreferrer noopener nofollow"
          target="_blank"
        >
          React DayPicker
        </a>
      </p>
    </div>
  );
}
