"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { useId, useState } from "react";

export default function Component() {
  const id = useId();
  const [theme, setTheme] = useState<string>("light");

  return (
    <div className="space-y-4">
      <legend className="font-medium text-foreground text-sm leading-none">
        Dark mode toggle checkbox
      </legend>
      <div className="flex flex-col justify-center">
        <input
          checked={theme === "dark"}
          className="peer sr-only"
          id={id}
          name={id}
          onChange={() =>
            setTheme((prev) => (prev === "dark" ? "light" : "dark"))
          }
          type="checkbox"
        />
        <label
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          className="group relative inline-flex size-9 items-center justify-center rounded-md border border-input bg-background text-foreground shadow-xs outline-none transition-[color,box-shadow] hover:bg-accent hover:text-accent-foreground peer-focus-visible:border-ring peer-focus-visible:ring-[3px] peer-focus-visible:ring-ring/50"
          htmlFor={id}
        >
          {/* Note: After dark mode implementation, rely on dark: prefix rather than group-peer-checked: */}
          <MoonIcon
            aria-hidden="true"
            className="shrink-0 scale-0 opacity-0 transition-all group-peer-checked:scale-100 group-peer-checked:opacity-100"
            size={16}
          />
          <SunIcon
            aria-hidden="true"
            className="absolute shrink-0 scale-100 opacity-100 transition-all group-peer-checked:scale-0 group-peer-checked:opacity-0"
            size={16}
          />
        </label>
      </div>
    </div>
  );
}
