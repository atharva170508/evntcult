import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/registry/default/ui/avatar";

export default function Component() {
  return (
    <div className="relative">
      <Avatar>
        <AvatarImage alt="Kelly King" src="/origin/avatar-80-07.jpg" />
        <AvatarFallback>KK</AvatarFallback>
      </Avatar>
      <span className="-end-0.5 -bottom-0.5 absolute size-3 rounded-full border-2 border-background bg-emerald-500">
        <span className="sr-only">Online</span>
      </span>
    </div>
  );
}
