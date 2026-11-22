import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/registry/default/ui/avatar";

export default function Component() {
  return (
    <div className="relative">
      <Avatar className="rounded-md">
        <AvatarImage alt="Kelly King" src="/origin/avatar-80-07.jpg" />
        <AvatarFallback>KK</AvatarFallback>
      </Avatar>
      <span className="-end-1 -top-1 absolute size-3 rounded-full border-2 border-background bg-emerald-500">
        <span className="sr-only">Online</span>
      </span>
    </div>
  );
}
