import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  type TooltipContentProps,
} from '@/components/animate-ui/components/radix/tooltip';
import { Button } from '@/components/ui/button';

interface RadixTooltipDemoProps {
  side: TooltipContentProps['side'];
  sideOffset: TooltipContentProps['sideOffset'];
  align: TooltipContentProps['align'];
  alignOffset: TooltipContentProps['alignOffset'];
  followCursor?: boolean | 'x' | 'y';
}

export function RadixTooltipDemo({
  side,
  sideOffset,
  align,
  alignOffset,
  followCursor,
}: RadixTooltipDemoProps) {
  return (
    <Tooltip followCursor={followCursor}>
      <TooltipTrigger asChild>
        <Button variant="outline">Hover</Button>
      </TooltipTrigger>
      <TooltipContent
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
      >
        <p>Add to library</p>
      </TooltipContent>
    </Tooltip>
  );
}
