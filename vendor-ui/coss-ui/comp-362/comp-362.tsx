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
            Chart
          </Button>
        </TooltipTrigger>
        <TooltipContent className="py-2">
          <div className="space-y-2">
            <div className="font-medium text-[13px]">Tuesday, Aug 13</div>
            <div className="flex items-center gap-2 text-xs">
              <svg
                aria-hidden="true"
                className="shrink-0 text-indigo-500"
                fill="currentColor"
                height="8"
                viewBox="0 0 8 8"
                width="8"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="4" cy="4" r="4" />
              </svg>
              <span className="flex grow gap-2">
                Sales <span className="ml-auto">$40</span>
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <svg
                aria-hidden="true"
                className="shrink-0 text-purple-500"
                fill="currentColor"
                height="8"
                viewBox="0 0 8 8"
                width="8"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="4" cy="4" r="4" />
              </svg>
              <span className="flex grow gap-2">
                Revenue <span className="ml-auto">$74</span>
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <svg
                aria-hidden="true"
                className="shrink-0 text-rose-500"
                fill="currentColor"
                height="8"
                viewBox="0 0 8 8"
                width="8"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="4" cy="4" r="4" />
              </svg>
              <span className="flex grow gap-2">
                Costs <span className="ml-auto">$410</span>
              </span>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
