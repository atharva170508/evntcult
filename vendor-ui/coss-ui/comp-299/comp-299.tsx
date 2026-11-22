"use client";

import { toast } from "sonner";

import { Button } from "@/registry/default/ui/button";

export default function Component() {
  return (
    <Button
      onClick={() => {
        toast("Your request was completed!", {
          action: {
            label: "Undo",
            onClick: () => console.log("Undo"),
          },
          description: "It was a long journey, but we made it!",
        });
      }}
      variant="outline"
    >
      Show sonner
    </Button>
  );
}
