"use client";

import { LoaderCircleIcon, MicIcon, SearchIcon } from "lucide-react";
import { useEffect, useId, useState } from "react";

import { Input } from "@/registry/default/ui/input";
import { Label } from "@/registry/default/ui/label";

export default function Component() {
  const id = useId();
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (inputValue) {
      setIsLoading(true);
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 500);
      return () => clearTimeout(timer);
    }
    setIsLoading(false);
  }, [inputValue]);

  return (
    <div className="*:not-first:mt-2">
      <Label htmlFor={id}>Search input with loader</Label>
      <div className="relative">
        <Input
          className="peer ps-9 pe-9"
          id={id}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Search..."
          type="search"
          value={inputValue}
        />
        <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
          {isLoading ? (
            <LoaderCircleIcon
              aria-label="Loading..."
              className="animate-spin"
              role="status"
              size={16}
            />
          ) : (
            <SearchIcon aria-hidden="true" size={16} />
          )}
        </div>
        <button
          aria-label="Press to speak"
          className="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-md text-muted-foreground/80 outline-none transition-[color,box-shadow] hover:text-foreground focus:z-10 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
          type="submit"
        >
          <MicIcon aria-hidden="true" size={16} />
        </button>
      </div>
    </div>
  );
}
