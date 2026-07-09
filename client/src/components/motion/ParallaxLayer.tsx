import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import type { ReactNode } from 'react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

type ParallaxLayerProps = {
  children?: ReactNode;
  className?: string;
  /** 0 = stays still while the section scrolls past, 1 = moves with scroll (no parallax). */
  speed?: number;
};

export default function ParallaxLayer({ children, className, speed = 0.4 }: ParallaxLayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!containerRef.current) return;
      const trigger = containerRef.current.parentElement ?? containerRef.current;

      gsap.to(containerRef.current, {
        yPercent: (1 - speed) * 40,
        ease: 'none',
        scrollTrigger: {
          trigger,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      });
    },
    { scope: containerRef, dependencies: [speed] },
  );

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}
