"use client";

import { addDays } from "date-fns";
import { useState } from "react";

import { Button } from "@/registry/default/ui/button";
import { Calendar } from "@/registry/default/ui/calendar";

export default function Component() {
  const today = new Date();
  const selectedDay = addDays(today, -28);
  const [month, setMonth] = useState(selectedDay);
  const [date, setDate] = useState<Date | undefined>(selectedDay);

  return (
    <div>
      <div className="rounded-md border p-2">
        <Calendar
          mode="single"
          month={month}
          onMonthChange={setMonth}
          onSelect={setDate}
          selected={date}
        />
        <Button
          className="mt-2 mb-1"
          onClick={() => setMonth(today)}
          size="sm"
          variant="outline"
        >
          Current month
        </Button>
      </div>
      <p
        aria-live="polite"
        className="mt-4 text-center text-muted-foreground text-xs"
        role="region"
      >
        With button -{" "}
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
