import { Toggle, type ToggleProps } from '@/components/animate-ui/components/radix/toggle';
import { Bold } from 'lucide-react';

interface RadixToggleDemoProps {
  variant: ToggleProps['variant'];
  size: ToggleProps['size'];
}

export function RadixToggleDemo({ variant, size }: RadixToggleDemoProps) {
  return (
    <Toggle aria-label="Toggle italic" variant={variant} size={size}>
      <Bold />
    </Toggle>
  );
}
