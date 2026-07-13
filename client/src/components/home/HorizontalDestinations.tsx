import { useEffect, useRef } from 'react';
import { Link } from 'wouter';
import { MapPin } from 'lucide-react';
import { motion, useMotionValue, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import Reveal from '@/components/motion/Reveal';
import { trpc } from '@/lib/trpc';

function Panel({ id, name, country, imageUrl }: { id: number; name: string; country: string; imageUrl: string | null }) {
  return (
    <Link
      href={`/destinations?destinationId=${id}`}
      className="group relative shrink-0 w-[78vw] sm:w-[52vw] md:w-[38vw] lg:w-[32vw] h-[56vh] md:h-[64vh] rounded-3xl overflow-hidden"
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={name}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="photo-placeholder absolute inset-0" />
      )}
      <div className="absolute inset-0 hero-vignette" />
      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
        <p className="label-caps !text-white/75 !text-[10px] mb-2 flex items-center gap-1.5">
          <MapPin size={12} /> {country}
        </p>
        <h3 className="font-serif text-2xl md:text-3xl text-white text-glow">{name}</h3>
      </div>
    </Link>
  );
}

/**
 * Scroll-hijack gallery: this section pins in place while vertical scroll
 * input drives horizontal movement of the panel track, then releases back to
 * normal vertical scroll once the track has fully passed. Track width is
 * measured (not guessed) so the translation range is exact regardless of how
 * many destinations come back from the API.
 */
export default function HorizontalDestinations() {
  const { data: destinations } = trpc.destinations.list.useQuery();
  const panels = (destinations ?? []).slice(0, 8);
  // Distinguish "still loading" (render the scroll-target section anyway, empty
  // for a moment) from "loaded and genuinely empty" (render nothing) — returning
  // null on that first loading render would mean the ref below never attaches to
  // a real element in time for useScroll's setup effect to find a valid target.
  const loadedEmpty = destinations !== undefined && panels.length === 0;

  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  // A motion value (not React state) so the measured width can update without
  // a re-render, and so the derived `x` below always reads the current value
  // instead of capturing a stale one — useTransform's array-range overload
  // doesn't react to a plain number changing across renders the way you'd expect.
  const scrollRange = useMotionValue(0);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const measure = () => {
      if (!trackRef.current) return;
      const trackWidth = trackRef.current.scrollWidth;
      const viewportWidth = trackRef.current.parentElement?.clientWidth ?? 0;
      scrollRange.set(Math.max(0, trackWidth - viewportWidth));
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [panels.length, scrollRange]);

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end end'] });
  const x = useTransform(() => scrollYProgress.get() * -scrollRange.get());

  if (loadedEmpty) return null;

  if (prefersReducedMotion) {
    return (
      <section className="py-section-gap">
        <div className="container mb-10">
          <Reveal>
            <p className="label-caps mb-4">Where to next</p>
            <h2 className="font-serif text-[28px] md:text-4xl">Destinations worth the trip</h2>
          </Reveal>
        </div>
        <div className="flex gap-5 overflow-x-auto no-scrollbar px-4 md:px-8 pb-2">
          {panels.map((d) => (
            <Panel key={d.id} id={d.id} name={d.name} country={d.country} imageUrl={d.imageUrl} />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section ref={sectionRef} className="relative" style={{ height: `${Math.max(200, panels.length * 45)}vh` }}>
      <div className="sticky top-0 h-screen flex flex-col justify-center overflow-hidden">
        <div className="container mb-8 md:mb-10 shrink-0">
          <Reveal>
            <p className="label-caps mb-4">Where to next</p>
            <h2 className="font-serif text-[28px] md:text-4xl">Destinations worth the trip</h2>
          </Reveal>
        </div>
        <motion.div ref={trackRef} style={{ x }} className="flex gap-5 md:gap-6 pl-4 md:pl-8 w-max">
          {panels.map((d) => (
            <Panel key={d.id} id={d.id} name={d.name} country={d.country} imageUrl={d.imageUrl} />
          ))}
          <div className="shrink-0 w-4 md:w-8" aria-hidden="true" />
        </motion.div>
      </div>
    </section>
  );
}
