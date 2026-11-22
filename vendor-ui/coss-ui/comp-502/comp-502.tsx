"use client";

import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useEffect, useId, useState } from "react";

import { Calendar } from "@/registry/default/ui/calendar";
import { Input } from "@/registry/default/ui/input";
import { Label } from "@/registry/default/ui/label";

export default function Component() {
  const id = useId();
  const today = new Date();
  const [month, setMonth] = useState(today);
  const [date, setDate] = useState<Date | undefined>(today);
  const [inputValue, setInputValue] = useState("");

  const handleDayPickerSelect = (date: Date | undefined) => {
    if (!date) {
      setInputValue("");
      setDate(undefined);
    } else {
      setDate(date);
      setMonth(date);
      setInputValue(format(date, "yyyy-MM-dd"));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    if (value) {
      const parsedDate = new Date(value);
      setDate(parsedDate);
      setMonth(parsedDate);
    } else {
      setDate(undefined);
    }
  };

  useEffect(() => {
    setInputValue(format(today, "yyyy-MM-dd"));
  }, [today]);

  return (
    <div>
      <div className="rounded-md border">
        <Calendar
          className="p-2"
          mode="single"
          month={month}
          onMonthChange={setMonth}
          onSelect={handleDayPickerSelect}
          selected={date}
        />
        <div className="border-t p-3">
          <div className="flex items-center gap-3">
            <Label className="text-xs" htmlFor={id}>
              Enter date
            </Label>
            <div className="relative grow">
              <Input
                aria-label="Select date"
                className="peer appearance-none ps-9 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                id={id}
                onChange={handleInputChange}
                type="date"
                value={inputValue}
              />
              <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
                <CalendarIcon aria-hidden="true" size={16} />
              </div>
            </div>
          </div>
        </div>
      </div>
      <p
        aria-live="polite"
        className="mt-4 text-center text-muted-foreground text-xs"
        role="region"
      >
        Date input -{" "}
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
