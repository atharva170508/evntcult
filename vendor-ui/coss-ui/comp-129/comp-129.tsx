"use client";

import { BellIcon } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/registry/default/ui/badge";
import { Button } from "@/registry/default/ui/button";

export default function Component() {
  const [count, setCount] = useState(3);

  const handleClick = () => {
    setCount(0);
  };

  return (
    <Button
      aria-label="Notifications"
      className="relative"
      onClick={handleClick}
      size="icon"
      variant="outline"
    >
      <BellIcon aria-hidden="true" size={16} />
      {count > 0 && (
        <Badge className="-top-2 -translate-x-1/2 absolute left-full min-w-5 px-1">
          {count > 99 ? "99+" : count}
        </Badge>
      )}
    </Button>
  );
}
