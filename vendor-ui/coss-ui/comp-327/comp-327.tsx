"use client";

import { CheckIcon, CopyIcon, UserRoundPlusIcon } from "lucide-react";
import { useId, useRef, useState } from "react";

import { cn } from "@/registry/default/lib/utils";
import { Button } from "@/registry/default/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/registry/default/ui/dialog";
import { Input } from "@/registry/default/ui/input";
import { Label } from "@/registry/default/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/registry/default/ui/tooltip";

export default function Component() {
  const id = useId();
  const [emails, setEmails] = useState([
    "mark@yourcompany.com",
    "jane@yourcompany.com",
    "",
  ]);
  const [copied, setCopied] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastInputRef = useRef<HTMLInputElement>(null);

  const addEmail = () => {
    setEmails([...emails, ""]);
  };

  const handleEmailChange = (index: number, value: string) => {
    const newEmails = [...emails];
    newEmails[index] = value;
    setEmails(newEmails);
  };

  const handleCopy = () => {
    if (inputRef.current) {
      navigator.clipboard.writeText(inputRef.current.value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Invite members</Button>
      </DialogTrigger>
      <DialogContent
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          lastInputRef.current?.focus();
        }}
      >
        <div className="flex flex-col gap-2">
          <div
            aria-hidden="true"
            className="flex size-11 shrink-0 items-center justify-center rounded-full border"
          >
            <UserRoundPlusIcon className="opacity-80" size={16} />
          </div>
          <DialogHeader>
            <DialogTitle className="text-left">Invite team members</DialogTitle>
            <DialogDescription className="text-left">
              Invite teammates to earn free components.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form className="space-y-5">
          <div className="space-y-4">
            <div className="*:not-first:mt-2">
              <Label>Invite via email</Label>
              <div className="space-y-3">
                {emails.map((email, index) => (
                  <Input
                    id={`team-email-${index + 1}`}
                    key={email}
                    onChange={(e) => handleEmailChange(index, e.target.value)}
                    placeholder="hi@yourcompany.com"
                    ref={index === emails.length - 1 ? lastInputRef : undefined}
                    type="email"
                    value={email}
                  />
                ))}
              </div>
            </div>
            <button
              className="text-sm underline hover:no-underline"
              onClick={addEmail}
              type="button"
            >
              + Add another
            </button>
          </div>
          <Button className="w-full" type="button">
            Send invites
          </Button>
        </form>

        <hr className="my-1 border-t" />

        <div className="*:not-first:mt-2">
          <Label htmlFor={id}>Invite via magic link</Label>
          <div className="relative">
            <Input
              className="pe-9"
              defaultValue="https://coss.com/ui/refer/87689"
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
                        copied ? "scale-100 opacity-100" : "scale-0 opacity-0",
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
                        copied ? "scale-0 opacity-0" : "scale-100 opacity-100",
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
      </DialogContent>
    </Dialog>
  );
}
