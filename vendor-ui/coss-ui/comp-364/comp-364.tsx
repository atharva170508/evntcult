import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/registry/default/ui/hover-card";

export default function HoverCardDemo() {
  return (
    <HoverCard>
      <div className="flex items-center gap-3">
        <img
          alt="Avatar"
          className="shrink-0 rounded-full"
          height={40}
          src="/origin/avatar-40-05.jpg"
          width={40}
        />
        <div className="space-y-0.5">
          <HoverCardTrigger asChild>
            <p>
              <a className="font-medium text-sm hover:underline" href="#">
                Keith Kennedy
              </a>
            </p>
          </HoverCardTrigger>
          <p className="text-muted-foreground text-xs">@k.kennedy</p>
        </div>
      </div>
      <HoverCardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <img
              alt="Avatar"
              className="shrink-0 rounded-full"
              height={40}
              src="/origin/avatar-40-05.jpg"
              width={40}
            />
            <div className="space-y-0.5">
              <p className="font-medium text-sm">Keith Kennedy</p>
              <p className="text-muted-foreground text-xs">@k.kennedy</p>
            </div>
          </div>
          <p className="text-muted-foreground text-sm">
            Designer at{" "}
            <strong className="font-medium text-foreground">@coss.com</strong>.
            Crafting web experiences with Tailwind CSS.
          </p>
          <div className="flex items-center gap-2">
            <div className="-space-x-1.5 flex">
              <img
                alt="Friend 01"
                className="rounded-full ring-1 ring-background"
                height={20}
                src="/origin/avatar-20-04.jpg"
                width={20}
              />
              <img
                alt="Friend 02"
                className="rounded-full ring-1 ring-background"
                height={20}
                src="/origin/avatar-20-05.jpg"
                width={20}
              />
              <img
                alt="Friend 03"
                className="rounded-full ring-1 ring-background"
                height={20}
                src="/origin/avatar-20-06.jpg"
                width={20}
              />
            </div>
            <div className="text-muted-foreground text-xs">
              3 mutual friends
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
