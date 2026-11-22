import { addDays } from "date-fns";

import { Calendar } from "@/registry/default/ui/calendar";

export default function Component() {
  const today = new Date();

  return (
    <div>
      <Calendar
        className="rounded-md border p-2"
        disabled={[
          { before: new Date() }, // Dates before today
          new Date(), // Today
          { dayOfWeek: [0, 6] }, // Weekends
          {
            from: addDays(today, 14), // 14th day from now
            to: addDays(today, 16), // 16th day from now
          },
          {
            from: addDays(today, 23), // 23th day from now
            to: addDays(today, 24), // 24th day from now
          },
        ]}
        excludeDisabled
        mode="range"
      />
      <p
        aria-live="polite"
        className="mt-4 text-center text-muted-foreground text-xs"
        role="region"
      >
        Disabled dates -{" "}
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
