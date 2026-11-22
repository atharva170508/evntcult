"use client";

import { ArrowRightIcon } from "lucide-react";
import { useState } from "react";

import { cn } from "@/registry/default/lib/utils";
import { Button } from "@/registry/default/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/registry/default/ui/dialog";

export default function Component() {
  const [step, setStep] = useState(1);

  const stepContent = [
    {
      description:
        "Discover a powerful collection of components designed to enhance your development workflow.",
      title: "Welcome to coss.com",
    },
    {
      description:
        "Each component is fully customizable and built with modern web standards in mind.",
      title: "Customizable Components",
    },
    {
      description:
        "Begin building amazing interfaces with our comprehensive component library.",
      title: "Ready to Start?",
    },
    {
      description:
        "Access our extensive documentation and community resources to make the most of coss.com.",
      title: "Get Support",
    },
  ];

  const totalSteps = stepContent.length;

  const handleContinue = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  return (
    <Dialog
      onOpenChange={(open) => {
        if (open) setStep(1);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">Onboarding</Button>
      </DialogTrigger>
      <DialogContent className="gap-0 p-0 [&>button:last-child]:text-white">
        <div className="p-2">
          <img
            alt="dialog"
            className="w-full rounded-md"
            height={216}
            src="/origin/dialog-content.png"
            width={382}
          />
        </div>
        <div className="space-y-6 px-6 pt-3 pb-6">
          <DialogHeader>
            <DialogTitle>{stepContent[step - 1].title}</DialogTitle>
            <DialogDescription>
              {stepContent[step - 1].description}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex justify-center space-x-1.5 max-sm:order-1">
              {[...Array(totalSteps)].map((_, index) => (
                <div
                  className={cn(
                    "size-1.5 rounded-full bg-primary",
                    index + 1 === step ? "bg-primary" : "opacity-20",
                  )}
                  key={String(index)}
                />
              ))}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="ghost">
                  Skip
                </Button>
              </DialogClose>
              {step < totalSteps ? (
                <Button
                  className="group"
                  onClick={handleContinue}
                  type="button"
                >
                  Next
                  <ArrowRightIcon
                    aria-hidden="true"
                    className="-me-1 opacity-60 transition-transform group-hover:translate-x-0.5"
                    size={16}
                  />
                </Button>
              ) : (
                <DialogClose asChild>
                  <Button type="button">Okay</Button>
                </DialogClose>
              )}
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
