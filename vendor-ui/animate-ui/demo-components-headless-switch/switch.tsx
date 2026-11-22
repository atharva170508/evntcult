import { Label } from '@/components/ui/label';
import { Switch } from '@/components/animate-ui/components/headless/switch';

export function HeadlessSwitchDemo() {
  return (
    <Label className="flex items-center gap-x-3">
      <Switch />
      Airplane Mode
    </Label>
  );
}
