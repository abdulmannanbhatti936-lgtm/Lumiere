import { useRef } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'wouter';
import { Move3d, Sparkles, Headset, ArrowRight } from 'lucide-react';
import { motion, useScroll, useTransform, useReducedMotion, type MotionValue } from 'framer-motion';
import Reveal from '@/components/motion/Reveal';

const PILLARS = [
  {
    id: 'tours',
    icon: Move3d,
    title: '3D Room Tours',
    copy: 'Walk every room before you book. Rotate, zoom, and get a real sense of scale, light, and layout — no surprises at check-in.',
  },
  {
    id: 'stays',
    icon: Sparkles,
    title: 'Curated Stays',
    copy: 'Every property on Lumière is scouted and vetted by our team — boutique hotels and villas chosen for character, not just star ratings.',
  },
  {
    id: 'concierge',
    icon: Headset,
    title: 'Private Concierge',
    copy: 'From late checkouts to dinner reservations, a real person is one message away for every booking, around the clock.',
  },
];

function StackCard({
  children,
  index,
  total,
  scrollYProgress,
}: {
  children: ReactNode;
  index: number;
  total: number;
  scrollYProgress: MotionValue<number>;
}) {
  const step = 1 / total;
  const start = index * step;
  const end = start + step;
  const buffer = step * 0.25;
  const isFirst = index === 0;
  const isLast = index === total - 1;

  // Each card lives in its own [start, end] slice of overall scroll progress:
  // it rises + fades in at the start of its slice (skipped for the first card,
  // which is just visible from the top), holds steady through the middle, then
  // shrinks + dims at the end of its slice so the next card reads as covering
  // it rather than the two just swapping instantly.
  const y = useTransform(scrollYProgress, [start, start + buffer], isFirst ? [0, 0] : [48, 0]);
  const enterOpacity = useTransform(scrollYProgress, [start, start + buffer], isFirst ? [1, 1] : [0, 1]);
  const scale = useTransform(scrollYProgress, [end - buffer, end], isLast ? [1, 1] : [1, 0.88]);
  const exitOpacity = useTransform(scrollYProgress, [end - buffer, end], isLast ? [1, 1] : [1, 0.45]);
  const opacity = useTransform([enterOpacity, exitOpacity], (values: number[]) => Math.min(...values));

  return (
    <motion.div
      style={{ y, scale, opacity, zIndex: index + 1 }}
      className="absolute inset-0 flex items-center justify-center px-4"
    >
      <div className="w-full max-w-2xl">{children}</div>
    </motion.div>
  );
}

function ScrollStack({ cards }: { cards: ReactNode[] }) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end end'] });

  return (
    <div ref={sectionRef} className="relative" style={{ height: `${cards.length * 70}vh` }}>
      <div className="sticky top-0 h-screen">
        {cards.map((card, i) => (
          <StackCard key={i} index={i} total={cards.length} scrollYProgress={scrollYProgress}>
            {card}
          </StackCard>
        ))}
      </div>
    </div>
  );
}

export default function ExperienceStack() {
  const prefersReducedMotion = useReducedMotion();

  const cards = PILLARS.map((pillar) => (
    <div key={pillar.id} className="card-elevated p-8 md:p-12 mx-auto">
      <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-6">
        <pillar.icon size={24} className="text-primary" />
      </div>
      <h3 className="font-serif text-2xl md:text-3xl mb-3">{pillar.title}</h3>
      <p className="text-muted-foreground text-base md:text-lg leading-relaxed">{pillar.copy}</p>
    </div>
  ));

  return (
    <section className="py-section-gap">
      <div className="container">
        <Reveal className="text-center max-w-xl mx-auto mb-14 md:mb-20">
          <p className="label-caps mb-4">The Lumière experience</p>
          <h2 className="font-serif text-[28px] md:text-4xl mb-4">An experience, not just a stay.</h2>
          <p className="text-muted-foreground text-lg">
            Every booking comes with more than a room key — keep scrolling.
          </p>
        </Reveal>
      </div>

      {prefersReducedMotion ? (
        <div className="container grid grid-cols-1 md:grid-cols-3 gap-gutter">
          {PILLARS.map((pillar) => (
            <div key={pillar.id} className="card-elevated p-8">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-5">
                <pillar.icon size={20} className="text-primary" />
              </div>
              <h3 className="font-serif text-xl mb-3">{pillar.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{pillar.copy}</p>
            </div>
          ))}
        </div>
      ) : (
        <ScrollStack cards={cards} />
      )}

      <Reveal className="container text-center mt-8 md:mt-4">
        <Link href="/experience" className="text-sm font-semibold text-primary inline-flex items-center gap-1.5">
          See the full experience <ArrowRight size={14} />
        </Link>
      </Reveal>
    </section>
  );
}
