import { useState } from 'react';
import { useSearch, Link } from 'wouter';
import { Clock, Users, ArrowRight } from 'lucide-react';
import Reveal from '@/components/motion/Reveal';
import HotelCard from '@/components/hotels/HotelCard';
import BackButton from '@/components/common/BackButton';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import { trpc } from '@/lib/trpc';

export default function Destinations() {
  const initialId = Number(new URLSearchParams(useSearch()).get('destinationId')) || null;
  const [selectedId, setSelectedId] = useState<number | null>(initialId);

  const { data: destinations, isLoading } = trpc.destinations.list.useQuery();
  const active = destinations?.find((d) => d.id === selectedId) ?? destinations?.[0];

  const { data: hotelsData } = trpc.hotels.list.useQuery(
    { destinationId: active?.id, limit: 6 },
    { enabled: !!active },
  );
  const { data: tours } = trpc.tours.list.useQuery({ destinationId: active?.id }, { enabled: !!active });

  if (isLoading || !active) {
    return (
      <div className="container py-16">
        <Skeleton className="h-64 w-full mb-10" />
      </div>
    );
  }

  return (
    <div className="bg-background pb-section-gap">
      {/* Hero band */}
      <section className="relative h-72 md:h-80 w-full overflow-hidden mb-8">
        {active.imageUrl ? (
          <img src={active.imageUrl} alt={active.name} fetchPriority="high" decoding="async" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="photo-placeholder absolute inset-0" />
        )}
        <div className="absolute inset-0 hero-vignette" />
        <div className="absolute top-5 left-0 right-0 container z-10">
          <BackButton fallbackHref="/tours" variant="dark" />
        </div>
        <div className="relative z-10 h-full container flex items-end pb-8">
          <h1 className="font-serif text-4xl md:text-5xl text-white text-glow">{active.name}</h1>
        </div>
      </section>

      <div className="container">
        {/* Destination switcher */}
        <div className="flex gap-2.5 overflow-x-auto no-scrollbar mb-10">
          {destinations?.map((d) => (
            <button
              key={d.id}
              onClick={() => setSelectedId(d.id)}
              className={`shrink-0 px-5 py-2.5 rounded-full text-sm font-semibold border transition-colors ${
                d.id === active.id
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card border-border text-foreground hover:border-primary/50'
              }`}
            >
              {d.name}
            </button>
          ))}
        </div>

        <Reveal>
          <p className="text-muted-foreground text-lg leading-relaxed max-w-2xl mb-14">
            {active.description || `Discover ${active.name}, ${active.country}.`}
          </p>
        </Reveal>

        {/* Stays in destination */}
        <Reveal className="mb-16">
          <h2 className="font-serif text-2xl mb-6">Stays in {active.name}</h2>
          {hotelsData && hotelsData.items.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-gutter">
              {hotelsData.items.map((hotel) => (
                <HotelCard
                  key={hotel.id}
                  id={hotel.id}
                  name={hotel.name}
                  city={hotel.city}
                  country={hotel.country}
                  starRating={hotel.starRating}
                  imageUrl={hotel.imageUrl}
                  price={Number(hotel.basePrice)}
                  category={hotel.category}
                  averageRating={hotel.averageRating}
                  reviewCount={hotel.reviewCount}
                />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No stays published in {active.name} yet.</p>
          )}
        </Reveal>

        {/* Tours in destination */}
        <Reveal>
          <h2 className="font-serif text-2xl mb-6">Tours in {active.name}</h2>
          {tours && tours.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-gutter">
              {tours.map((tour) => (
                <Link key={tour.id} href={`/tour/${tour.id}`}>
                  <div className="card-luxury cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg hover:border-primary/30">
                    <span className="label-caps !text-[10px] block mb-2">{tour.category}</span>
                    <h3 className="font-serif text-lg font-semibold mb-2">{tour.name}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <span className="flex items-center gap-1.5">
                        <Clock size={13} /> {tour.durationDays} day{tour.durationDays > 1 ? 's' : ''}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Users size={13} /> up to {tour.groupSize}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold">
                        {formatCurrency(Number(tour.pricePerPerson))}
                        <span className="text-xs text-muted-foreground font-normal"> / person</span>
                      </span>
                      <ArrowRight size={14} className="text-primary" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No tours published in {active.name} yet.</p>
          )}
        </Reveal>
      </div>
    </div>
  );
}
