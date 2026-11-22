import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/registry/default/ui/avatar";

export default function Component() {
  return (
    <Avatar className="rounded-md">
      <AvatarImage alt="Kelly King" src="/origin/avatar-80-07.jpg" />
      <AvatarFallback>KK</AvatarFallback>
    </Avatar>
  );
}
