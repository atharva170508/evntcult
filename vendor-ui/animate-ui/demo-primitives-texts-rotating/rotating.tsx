import {
  RotatingText,
  RotatingTextContainer,
} from '@/components/animate-ui/primitives/texts/rotating';

interface RotatingTextDemoProps {
  delay: number;
  y: number;
  duration: number;
}

export const RotatingTextDemo = ({
  delay,
  y,
  duration,
}: RotatingTextDemoProps) => {
  return (
    <RotatingTextContainer
      key={delay}
      delay={delay}
      y={y}
      duration={duration}
      className="text-4xl font-semibold"
      text={['Rotating', 'Text', 'Demo']}
    >
      <RotatingText />
    </RotatingTextContainer>
  );
};
