import { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import type { ReactNode, MouseEvent } from 'react';

type TiltCardProps = {
  children: ReactNode;
  className?: string;
  maxTilt?: number;
  onClick?: () => void;
};

export default function TiltCard({ children, className, maxTilt = 10, onClick }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);

  const springPx = useSpring(px, { stiffness: 200, damping: 20, mass: 0.4 });
  const springPy = useSpring(py, { stiffness: 200, damping: 20, mass: 0.4 });

  const rotateX = useTransform(springPy, [0, 1], [maxTilt, -maxTilt]);
  const rotateY = useTransform(springPx, [0, 1], [-maxTilt, maxTilt]);
  const glowX = useTransform(springPx, [0, 1], ['0%', '100%']);
  const glowY = useTransform(springPy, [0, 1], ['0%', '100%']);
  const glowBackground = useTransform(
    [glowX, glowY],
    ([x, y]) => `radial-gradient(circle at ${x} ${y}, hsl(var(--primary) / 0.25), transparent 60%)`,
  );

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    px.set((e.clientX - rect.left) / rect.width);
    py.set((e.clientY - rect.top) / rect.height);
  };

  const handleMouseLeave = () => {
    px.set(0.5);
    py.set(0.5);
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ position: 'relative', rotateX, rotateY, transformStyle: 'preserve-3d', transformPerspective: 1000 }}
      whileHover={{ scale: 1.03 }}
      transition={{ scale: { duration: 0.3 } }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
    >
      <motion.div
        className="pointer-events-none absolute inset-0 z-10 opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-[inherit]"
        style={{ background: glowBackground }}
      />
      {children}
    </motion.div>
  );
}
