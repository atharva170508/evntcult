import { Button } from "@/registry/default/ui/button";

export default function Component() {
  return (
    <Button className="gap-0 rounded-full py-0 ps-0">
      <div className="me-0.5 flex aspect-square h-full p-1.5">
        <img
          alt="Profile image"
          aria-hidden="true"
          className="h-auto w-full rounded-full"
          height={24}
          src="/origin/avatar.jpg"
          width={24}
        />
      </div>
      @georgelucas
    </Button>
  );
}
