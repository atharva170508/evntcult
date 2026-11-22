"use client";

import { useState } from "react";

import { Calendar } from "@/registry/default/ui/calendar";

export default function Component() {
  const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <div>
      <Calendar
        className="rounded-md border p-2"
        mode="single"
        onSelect={setDate}
        selected={date}
      />
      <p
        aria-live="polite"
        className="mt-4 text-center text-muted-foreground text-xs"
        role="region"
      >
        Calendar -{" "}
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
