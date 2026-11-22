import { UserRoundIcon } from "lucide-react";

import { Avatar, AvatarFallback } from "@/registry/default/ui/avatar";

export default function Component() {
  return (
    <Avatar>
      <AvatarFallback>
        <UserRoundIcon aria-hidden="true" className="opacity-60" size={16} />
      </AvatarFallback>
    </Avatar>
  );
}
