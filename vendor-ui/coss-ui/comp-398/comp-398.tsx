import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/registry/default/ui/avatar";
import { Badge } from "@/registry/default/ui/badge";

export default function Component() {
  return (
    <div className="relative">
      <Avatar>
        <AvatarImage alt="Kelly King" src="/origin/avatar-80-07.jpg" />
        <AvatarFallback>KK</AvatarFallback>
      </Avatar>
      <Badge className="-top-1.5 -translate-x-3.5 absolute left-full min-w-5 border-background px-1">
        6
      </Badge>
    </div>
  );
}
