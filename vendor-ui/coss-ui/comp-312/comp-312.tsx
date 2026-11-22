"use client";

import { DownloadIcon, LoaderCircleIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/registry/default/ui/button";

export default function Component() {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = () => {
    setIsDownloading(true);
    // Simulate download
    setTimeout(() => {
      setIsDownloading(false);
    }, 2000);
  };

  return (
    <div className="bg-muted px-4 py-3 md:py-2">
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
        <p className="text-sm">
          <span className="font-medium">v2.1.0</span>
          <span className="mx-2 text-muted-foreground">•</span>
          New features and improvements available
        </p>
        <Button
          className="min-w-24"
          disabled={isDownloading}
          onClick={handleDownload}
          size="sm"
          variant="outline"
        >
          {isDownloading ? (
            <>
              <LoaderCircleIcon
                aria-hidden="true"
                className="-ms-0.5 me-2 animate-spin"
                size={16}
              />
              Updating...
            </>
          ) : (
            <>
              <DownloadIcon aria-hidden="true" className="-ms-0.5" size={16} />
              Update now
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
