"use client";

import { useState } from "react";
import type { WeekNumberProps } from "react-day-picker";

import { Calendar } from "@/registry/default/ui/calendar";

export default function Component() {
  const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <div>
      <Calendar
        className="rounded-md border p-2"
        components={{
          WeekNumber: ({ week, ...props }: WeekNumberProps) => {
            return (
              <th {...props}>
                <span className="inline-flex size-9 items-center justify-center">
                  {week.weekNumber}
                </span>
              </th>
            );
          },
        }}
        fixedWeeks
        mode="single"
        onSelect={setDate}
        selected={date}
        showWeekNumber
      />
      <p
        aria-live="polite"
        className="mt-4 text-center text-muted-foreground text-xs"
        role="region"
      >
        Weekly numbers -{" "}
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
