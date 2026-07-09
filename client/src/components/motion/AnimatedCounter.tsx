import { useEffect, useRef } from 'react';
import { animate, motion, useInView } from 'framer-motion';

type AnimatedCounterProps = {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
};

export default function AnimatedCounter({
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  className,
}: AnimatedCounterProps) {
  const spanRef = useRef<HTMLSpanElement>(null);
  const isInView = useInView(spanRef, { once: true, margin: '-40px' });

  useEffect(() => {
    const node = spanRef.current;
    if (!isInView || !node) return;

    const controls = animate(0, value, {
      duration: 1.6,
      ease: [0.16, 1, 0.3, 1],
      onUpdate(latest) {
        node.textContent = `${prefix}${latest.toFixed(decimals)}${suffix}`;
      },
    });

    return () => controls.stop();
  }, [isInView, value, prefix, suffix, decimals]);

  return (
    <motion.span ref={spanRef} className={className}>
      {prefix}0{suffix}
    </motion.span>
  );
}
