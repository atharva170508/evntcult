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
            Tiny
          </Button>
        </TooltipTrigger>
        <TooltipContent className="px-2 py-1 text-xs">
          This is a simple tooltip
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
