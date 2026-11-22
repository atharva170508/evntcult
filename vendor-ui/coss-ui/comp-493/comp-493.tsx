"use client";

import { addDays, subDays } from "date-fns";
import { useState } from "react";

import { Calendar } from "@/registry/default/ui/calendar";

export default function Component() {
  const today = new Date();
  const [date, setDate] = useState<Date[] | undefined>([
    subDays(today, 17),
    addDays(today, 2),
    addDays(today, 6),
    addDays(today, 8),
  ]);

  return (
    <div>
      <Calendar
        className="rounded-md border p-2"
        mode="multiple"
        onSelect={setDate}
        selected={date}
      />
      <p
        aria-live="polite"
        className="mt-4 text-center text-muted-foreground text-xs"
        role="region"
      >
        Multiple day selection -{" "}
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
