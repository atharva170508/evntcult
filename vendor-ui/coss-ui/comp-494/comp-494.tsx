"use client";

import { useState } from "react";

import { Calendar } from "@/registry/default/ui/calendar";

export default function Component() {
  const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <div>
      <Calendar
        className="rounded-md border p-2"
        classNames={{
          day_button: "rounded-full",
        }}
        mode="single"
        onSelect={setDate}
        selected={date}
      />
      <p
        aria-live="polite"
        className="mt-4 text-center text-muted-foreground text-xs"
        role="region"
      >
        Custom select day style -{" "}
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
