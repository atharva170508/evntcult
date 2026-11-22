import { GradientText } from '@/components/animate-ui/primitives/texts/gradient';

interface GradientTextDemoProps {
  neon: boolean;
}

export const GradientTextDemo = ({ neon }: GradientTextDemoProps) => {
  return (
    <GradientText
      className="text-4xl font-semibold"
      text="Gradient Text"
      neon={neon}
    />
  );
};
