'use client';
import { ReactNode, useRef, useState } from 'react';
import {
  m,
  useInView,
  Variant,
  Transition,
  UseInViewOptions,
} from 'motion/react';

export type InViewProps = {
  children: ReactNode;
  className?: string;
  variants?: {
    hidden: Variant;
    visible: Variant;
  };
  transition?: Transition;
  viewOptions?: UseInViewOptions;
  as?: keyof typeof m;
  once?: boolean;
};

const defaultVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
};

export function InView({
  children,
  className,
  variants = defaultVariants,
  transition,
  viewOptions,
  as = 'div',
  once = true,
}: InViewProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, viewOptions);
  const [isViewed, setIsViewed] = useState(false);

  const MotionComponent = m[as] as typeof m.div;

  return (
    <MotionComponent
      ref={ref}
      className={className}
      initial='hidden'
      onAnimationComplete={() => {
        if (once) setIsViewed(true);
      }}
      animate={isInView || isViewed ? 'visible' : 'hidden'}
      variants={variants}
      transition={transition}
    >
      {children}
    </MotionComponent>
  );
}
