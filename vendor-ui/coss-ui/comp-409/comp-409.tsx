import { Button } from "@/registry/default/ui/button";

export default function Component() {
  return (
    <div className="-space-x-3 flex">
      <img
        alt="Avatar 01"
        className="rounded-full ring-2 ring-background"
        height={40}
        src="/origin/avatar-80-03.jpg"
        width={40}
      />
      <img
        alt="Avatar 02"
        className="rounded-full ring-2 ring-background"
        height={40}
        src="/origin/avatar-80-04.jpg"
        width={40}
      />
      <img
        alt="Avatar 03"
        className="rounded-full ring-2 ring-background"
        height={40}
        src="/origin/avatar-80-05.jpg"
        width={40}
      />
      <img
        alt="Avatar 04"
        className="rounded-full ring-2 ring-background"
        height={40}
        src="/origin/avatar-80-06.jpg"
        width={40}
      />
      <Button
        className="flex size-10 items-center justify-center rounded-full bg-secondary text-muted-foreground text-xs ring-2 ring-background hover:bg-secondary hover:text-foreground"
        size="icon"
        variant="secondary"
      >
        +3
      </Button>
    </div>
  );
}
