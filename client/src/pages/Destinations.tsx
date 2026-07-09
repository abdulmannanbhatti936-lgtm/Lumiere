import { useState } from 'react';
import { Link } from 'wouter';
import { MapPin, ArrowRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Globe3D from '@/components/3d/Globe';
import Reveal from '@/components/motion/Reveal';
import Magnetic from '@/components/motion/Magnetic';
import TiltCard from '@/components/motion/TiltCard';
import { Skeleton } from '@/components/ui/skeleton';
import { trpc } from '@/lib/trpc';

export default function Destinations() {
  const [selectedDestinationId, setSelectedDestinationId] = useState<number | null>(null);
  const { data: destinations, isLoading, isError } = trpc.destinations.list.useQuery();

  const selectedDestination = destinations?.find((d) => d.id === selectedDestinationId);

  return (
    <div className="relative min-h-screen bg-background py-12 md:py-20 overflow-hidden">
      <div className="absolute -top-1/3 -left-1/4 w-[50vw] h-[50vw] aurora-glow-teal pointer-events-none" />
      <div className="absolute top-0 -right-1/4 w-[45vw] h-[45vw] aurora-glow pointer-events-none" />

      <div className="container relative">
        {/* Header */}
        <Reveal className="text-center mb-16">
          <span className="label-caps mb-4 block">The Global Portfolio</span>
          <h1 className="font-serif text-4xl md:text-5xl mb-4">
            Curated <span className="italic text-accent">Sanctuaries</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Discover luxury hotels in the world's most coveted destinations.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter mb-16">
          {/* 3D Globe */}
          <Reveal className="lg:col-span-1">
            <div className="glass-panel h-96 p-6">
              <h3 className="label-caps !text-foreground mb-4">Interactive Globe</h3>
              <div className="h-[calc(100%-2rem)]">
                <Globe3D />
              </div>
            </div>
          </Reveal>

          {/* Destinations Grid */}
          <div className="lg:col-span-2">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-64" />
                ))}
              </div>
            ) : isError ? (
              <div className="glass-panel text-center py-16">
                <p className="text-muted-foreground text-lg">
                  Something went wrong loading destinations. Please try again.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {destinations?.map((destination, i) => (
                  <Reveal key={destination.id} delay={i * 0.06}>
                    <TiltCard
                      onClick={() => setSelectedDestinationId(destination.id)}
                      className="h-64 overflow-hidden rounded-md group cursor-pointer border border-white/10 hover:border-primary/40 transition-colors duration-500"
                    >
                      {destination.imageUrl ? (
                        <img
                          src={destination.imageUrl}
                          alt={destination.name}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-card" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />

                      <div className="absolute bottom-0 left-0 right-0 p-6">
                        <span className="label-caps !text-[10px] mb-1 flex items-center gap-1.5">
                          <MapPin size={12} /> {destination.country}
                        </span>
                        <h3 className="font-serif text-2xl mb-2 group-hover:italic transition-all duration-300">
                          {destination.name}
                        </h3>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-500">
                          <span className="label-caps !text-[10px] border-b border-accent/40 pb-0.5">
                            Explore
                          </span>
                          <ArrowRight size={13} className="text-accent" />
                        </div>
                      </div>
                    </TiltCard>
                  </Reveal>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Selected Destination Details */}
        <AnimatePresence>
          {selectedDestination && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="glass-panel p-10"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-3xl">
                  {selectedDestination.name}, {selectedDestination.country}
                </h2>
                <button
                  onClick={() => setSelectedDestinationId(null)}
                  className="text-muted-foreground hover:text-accent transition-colors"
                  aria-label="Close"
                >
                  <X size={22} />
                </button>
              </div>

              <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                {selectedDestination.description}
              </p>

              <Magnetic className="block w-full">
                <Link href={`/hotels?city=${encodeURIComponent(selectedDestination.name)}`}>
                  <button className="btn-primary w-full">
                    View Hotels in {selectedDestination.name}
                  </button>
                </Link>
              </Magnetic>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
