import { Button } from "@/registry/default/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/registry/default/ui/tooltip";

export default function Component() {
  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="sm" variant="outline">
            W/ image
          </Button>
        </TooltipTrigger>
        <TooltipContent className="py-3">
          <div className="space-y-2">
            <img
              alt="Content"
              className="w-full rounded"
              height={216}
              src="/origin/dialog-content.png"
              width={382}
            />
            <div className="space-y-1">
              <p className="font-medium text-[13px]">
                Tooltip with title and icon
              </p>
              <p className="text-muted-foreground text-xs">
                Tooltips are made to be highly customizable, with features like
                dynamic placement, rich content, and a robust API.
              </p>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
