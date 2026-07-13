import { Link } from 'wouter';
import { ArrowRight, Clock, Users } from 'lucide-react';
import Reveal from '@/components/motion/Reveal';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import { trpc } from '@/lib/trpc';

export default function Tours() {
  const { data: tours, isLoading, isError } = trpc.tours.list.useQuery();

  return (
    <div className="bg-background pb-section-gap">
      <div className="container">
        <Reveal className="mb-12 max-w-2xl">
          <h1 className="font-serif text-3xl md:text-4xl mb-3">Guided tours &amp; experiences</h1>
          <p className="text-muted-foreground text-lg">
            Curated, small-group experiences led by local guides across our destinations.
          </p>
        </Reveal>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-gutter">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card-luxury">
                <Skeleton className="w-full h-44 mb-4" />
                <Skeleton className="h-5 w-3/4 mb-3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="glass-panel text-center py-16">
            <p className="text-muted-foreground text-lg">Something went wrong loading tours. Please try again.</p>
          </div>
        ) : !tours || tours.length === 0 ? (
          <div className="glass-panel text-center py-16">
            <p className="text-muted-foreground text-lg">No tours published yet — check back soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-gutter">
            {tours.map((tour, i) => (
              <Reveal key={tour.id} delay={Math.min(i * 0.06, 0.4)}>
                <Link href={`/tour/${tour.id}`}>
                  <div className="group glass-panel overflow-hidden cursor-pointer h-full flex flex-col">
                    <div className="relative h-44 overflow-hidden">
                      {tour.imageUrl ? (
                        <img
                          src={tour.imageUrl}
                          alt={tour.name}
                          loading="lazy"
                          decoding="async"
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="photo-placeholder absolute inset-0 flex items-center justify-center">
                          <span className="photo-placeholder-caption">PHOTO — {tour.destination.name}</span>
                        </div>
                      )}
                      <span className="absolute top-4 left-4 label-caps !text-[10px] bg-card/95 px-3 py-1.5 rounded-full">
                        {tour.category}
                      </span>
                    </div>
                    <div className="p-5 flex flex-col flex-1">
                      <h3 className="font-serif text-xl font-semibold leading-tight mb-2">{tour.name}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                        <span className="flex items-center gap-1.5">
                          <Clock size={13} /> {tour.durationDays} day{tour.durationDays > 1 ? 's' : ''}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Users size={13} /> up to {tour.groupSize}
                        </span>
                      </div>
                      <div className="mt-auto flex items-center justify-between pt-3 border-t border-border">
                        <span className="text-base font-bold">
                          {formatCurrency(Number(tour.pricePerPerson))}
                          <span className="text-xs text-muted-foreground font-normal"> / person</span>
                        </span>
                        <span className="text-sm font-semibold text-primary flex items-center gap-1">
                          Explore <ArrowRight size={13} />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
