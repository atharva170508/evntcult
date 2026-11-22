import { Shine } from '@/components/animate-ui/primitives/effects/shine';
import { Button } from '@/components/ui/button';

type ShineDemoProps = {
  delay?: number;
  duration?: number;
  loop?: boolean;
  loopDelay?: number;
  deg?: number;
  enable?: boolean;
  enableOnHover?: boolean;
  enableOnTap?: boolean;
};

export default function SlideDemo({
  delay,
  duration,
  loop,
  loopDelay,
  deg,
  enable,
  enableOnHover,
  enableOnTap,
}: ShineDemoProps) {
  return (
    <Shine
      delay={delay}
      duration={duration}
      loop={loop}
      loopDelay={loopDelay}
      deg={deg}
      enable={enable}
      enableOnHover={enableOnHover}
      enableOnTap={enableOnTap}
      asChild
    >
      <Button>Shine Effect</Button>
    </Shine>
  );
}
