"use client";

import { LoaderCircleIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/registry/default/ui/button";

export default function Component() {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleClick = () => {
    setIsLoading(true);
    // Simulate an async operation
    setTimeout(() => {
      setIsLoading(false);
    }, 1000); // Reset after 1 second
  };

  return (
    <Button
      className="group relative disabled:opacity-100"
      data-loading={isLoading || undefined}
      disabled={isLoading}
      onClick={handleClick}
    >
      <span className="group-data-loading:text-transparent">Click me</span>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <LoaderCircleIcon
            aria-hidden="true"
            className="animate-spin"
            size={16}
          />
        </div>
      )}
    </Button>
  );
}
