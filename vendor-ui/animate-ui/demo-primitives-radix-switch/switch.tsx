import { Switch, SwitchThumb } from '@/components/animate-ui/primitives/radix/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export const RadixSwitchDemo = () => {
  return (
    <Label className="flex items-center gap-x-3">
      <Switch
        className={cn(
          'relative flex p-0.5 h-6 w-10 items-center justify-start rounded-full border transition-colors',
          'data-[state=checked]:bg-primary data-[state=checked]:justify-end',
        )}
        defaultChecked
      >
        <SwitchThumb
          className="rounded-full bg-accent h-full aspect-square"
          pressedAnimation={{ width: 22 }}
        />
      </Switch>
      Airplane mode
    </Label>
  );
};
