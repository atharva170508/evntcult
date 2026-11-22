"use client";

import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/registry/default/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/registry/default/ui/popover";

const tips = [
  {
    description:
      "This is your new workspace. Here you'll find all your projects, recent activities, settings, and more.",
    title: "Welcome to Dashboard",
  },
  {
    description:
      "Use the toolbar above to create new projects, invite team members, or access settings.",
    title: "Quick Actions",
  },
  {
    description:
      "Click the support icon in the top right corner to access our help center and documentation.",
    title: "Need Help?",
  },
  {
    description:
      "Press ⌘K to open the command palette. Use arrow keys to navigate and Enter to select an action.",
    title: "Keyboard Shortcuts",
  },
  {
    description:
      "Enable notifications to receive updates about your projects, team activity, and important deadlines.",
    title: "Stay Updated",
  },
];

export default function Component() {
  const [currentTip, setCurrentTip] = useState(0);

  const handleNext = () => {
    if (currentTip < tips.length - 1) {
      setCurrentTip(currentTip + 1);
    }
  };

  const handlePrev = () => {
    if (currentTip > 0) {
      setCurrentTip(currentTip - 1);
    }
  };

  const isFirstTip = currentTip === 0;
  const isLastTip = currentTip === tips.length - 1;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Tooltip-like with nav</Button>
      </PopoverTrigger>
      <PopoverContent className="max-w-[280px] py-3 shadow-none" side="top">
        <div className="space-y-3">
          <div className="space-y-1">
            <p className="font-medium text-[13px]">{tips[currentTip].title}</p>
            <p className="text-muted-foreground text-xs">
              {tips[currentTip].description}
            </p>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs">
              {currentTip + 1}/{tips.length}
            </span>
            <div className="flex gap-0.5">
              <Button
                aria-label="Previous tip"
                className="size-6"
                disabled={isFirstTip}
                onClick={handlePrev}
                size="icon"
                variant="ghost"
              >
                <ArrowLeftIcon aria-hidden="true" size={14} />
              </Button>
              <Button
                aria-label="Next tip"
                className="size-6"
                disabled={isLastTip}
                onClick={handleNext}
                size="icon"
                variant="ghost"
              >
                <ArrowRightIcon aria-hidden="true" size={14} />
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
