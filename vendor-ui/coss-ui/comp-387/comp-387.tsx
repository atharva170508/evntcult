"use client";

import {
  RiCodeFill,
  RiFacebookFill,
  RiMailLine,
  RiTwitterXFill,
} from "@remixicon/react";
import { CheckIcon, CopyIcon } from "lucide-react";
import { useId, useRef, useState } from "react";

import { cn } from "@/registry/default/lib/utils";
import { Button } from "@/registry/default/ui/button";
import { Input } from "@/registry/default/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/registry/default/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/registry/default/ui/tooltip";

export default function Component() {
  const id = useId();
  const [copied, setCopied] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCopy = () => {
    if (inputRef.current) {
      navigator.clipboard.writeText(inputRef.current.value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">Share</Button>
        </PopoverTrigger>
        <PopoverContent className="w-72">
          <div className="flex flex-col gap-3 text-center">
            <div className="font-medium text-sm">Share code</div>
            <div className="flex flex-wrap justify-center gap-2">
              <Button aria-label="Embed" size="icon" variant="outline">
                <RiCodeFill aria-hidden="true" size={16} />
              </Button>
              <Button
                aria-label="Share on Twitter"
                size="icon"
                variant="outline"
              >
                <RiTwitterXFill aria-hidden="true" size={16} />
              </Button>
              <Button
                aria-label="Share on Facebook"
                size="icon"
                variant="outline"
              >
                <RiFacebookFill aria-hidden="true" size={16} />
              </Button>
              <Button
                aria-label="Share via email"
                size="icon"
                variant="outline"
              >
                <RiMailLine aria-hidden="true" size={16} />
              </Button>
            </div>
            <div className="space-y-2">
              <div className="relative">
                <Input
                  aria-label="Share link"
                  className="pe-9"
                  defaultValue="https://coss.com/origin/Avx8HD"
                  id={id}
                  readOnly
                  ref={inputRef}
                  type="text"
                />
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        aria-label={copied ? "Copied" : "Copy to clipboard"}
                        className="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-md text-muted-foreground/80 outline-none transition-[color,box-shadow] hover:text-foreground focus:z-10 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed"
                        disabled={copied}
                        onClick={handleCopy}
                        type="button"
                      >
                        <div
                          className={cn(
                            "transition-all",
                            copied
                              ? "scale-100 opacity-100"
                              : "scale-0 opacity-0",
                          )}
                        >
                          <CheckIcon
                            aria-hidden="true"
                            className="stroke-emerald-500"
                            size={16}
                          />
                        </div>
                        <div
                          className={cn(
                            "absolute transition-all",
                            copied
                              ? "scale-0 opacity-0"
                              : "scale-100 opacity-100",
                          )}
                        >
                          <CopyIcon aria-hidden="true" size={16} />
                        </div>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="px-2 py-1 text-xs">
                      Copy to clipboard
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
