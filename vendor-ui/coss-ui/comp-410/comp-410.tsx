import { Button } from "@/registry/default/ui/button";

export default function Component() {
  return (
    <div className="flex items-center rounded-full bg-muted p-0.5">
      <div className="-space-x-3 flex">
        <img
          alt="Avatar 01"
          className="rounded-full ring-2 ring-muted"
          height={40}
          src="/origin/avatar-80-03.jpg"
          width={40}
        />
        <img
          alt="Avatar 02"
          className="rounded-full ring-2 ring-muted"
          height={40}
          src="/origin/avatar-80-04.jpg"
          width={40}
        />
        <img
          alt="Avatar 03"
          className="rounded-full ring-2 ring-muted"
          height={40}
          src="/origin/avatar-80-05.jpg"
          width={40}
        />
        <img
          alt="Avatar 04"
          className="rounded-full ring-2 ring-muted"
          height={40}
          src="/origin/avatar-80-06.jpg"
          width={40}
        />
      </div>
      <Button
        className="flex items-center justify-center rounded-full bg-transparent px-3 text-muted-foreground text-xs shadow-none hover:bg-transparent hover:text-foreground"
        variant="secondary"
      >
        +3
      </Button>
    </div>
  );
}
