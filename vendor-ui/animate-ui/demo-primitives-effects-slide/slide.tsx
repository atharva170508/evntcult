import {
  Slide,
  type SlideDirection,
} from '@/components/animate-ui/primitives/effects/slide';

type SlideDemoProps = {
  delay?: number;
  direction?: SlideDirection;
  offset?: number;
};

export default function SlideDemo({
  delay = 0,
  direction = 'up',
  offset = 100,
}: SlideDemoProps) {
  return (
    <Slide
      delay={delay}
      direction={direction}
      offset={offset}
      className="px-6 py-4 bg-accent"
    >
      Slide
    </Slide>
  );
}
