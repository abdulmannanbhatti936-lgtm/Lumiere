import { useRoute, Link } from 'wouter';
import { Clock, Users, MapPin, Loader2, ArrowRight, Check } from 'lucide-react';
import Reveal from '@/components/motion/Reveal';
import Magnetic from '@/components/motion/Magnetic';
import HotelCard from '@/components/hotels/HotelCard';
import { formatCurrency } from '@/lib/utils';
import { trpc } from '@/lib/trpc';

const INCLUDED = ['Local, English-speaking guide', 'All entry fees and permits', 'Small-group size, never a mega-bus tour', 'Hotel pickup where available'];

export default function TourDetail() {
  const [, params] = useRoute('/tour/:id');
  const tourId = Number(params?.id);

  const { data: tour, isLoading, isError } = trpc.tours.getById.useQuery({ id: tourId }, { enabled: Number.isFinite(tourId) });
  const { data: hotelsData } = trpc.hotels.list.useQuery(
    { destinationId: tour?.destinationId, limit: 3 },
    { enabled: !!tour?.destinationId },
  );

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 size={40} className="animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !tour) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-muted-foreground text-lg">Tour not found.</p>
      </div>
    );
  }

  const enquireHref = `/contact?subject=${encodeURIComponent('Booking support')}&tour=${encodeURIComponent(tour.name)}`;

  return (
    <div className="bg-background pb-section-gap">
      {/* Hero */}
      <section className="relative h-72 md:h-[420px] w-full overflow-hidden mb-10">
        {tour.imageUrl ? (
          <img src={tour.imageUrl} alt={tour.name} fetchPriority="high" decoding="async" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="photo-placeholder absolute inset-0" />
        )}
        <div className="absolute inset-0 hero-vignette" />
        <div className="relative z-10 h-full container flex flex-col justify-end pb-8">
          <span className="label-caps !text-white/80 !text-[10px] mb-3 flex items-center gap-1.5">
            <MapPin size={12} /> {tour.destination.name}, {tour.destination.country}
          </span>
          <h1 className="font-serif text-3xl md:text-5xl text-white text-glow max-w-2xl">{tour.name}</h1>
        </div>
      </section>

      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter mb-16">
          <div className="lg:col-span-2">
            <Reveal className="flex items-center gap-3 flex-wrap mb-8">
              <span className="label-caps !text-[10px] px-3 py-1.5 rounded-full border border-border">{tour.category}</span>
              <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock size={14} className="text-accent" /> {tour.durationDays} day{tour.durationDays > 1 ? 's' : ''}
              </span>
              <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <Users size={14} className="text-accent" /> Up to {tour.groupSize} guests
              </span>
            </Reveal>

            <Reveal className="mb-12">
              <h2 className="font-serif text-2xl mb-4">About this experience</h2>
              <p className="text-muted-foreground text-lg leading-relaxed">{tour.description || 'No description available yet.'}</p>
            </Reveal>

            <Reveal>
              <h2 className="font-serif text-2xl mb-6">What's included</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                {INCLUDED.map((item) => (
                  <div key={item} className="flex items-center gap-2.5 text-sm">
                    <Check size={15} className="text-primary shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </Reveal>
          </div>

          <div className="lg:col-span-1">
            <Reveal>
              <div className="glass-panel p-7 lg:sticky lg:top-[126px]">
                <p className="label-field mb-2">Price</p>
                <p className="font-serif text-3xl text-primary mb-6">
                  {formatCurrency(Number(tour.pricePerPerson))}
                  <span className="text-sm text-muted-foreground font-sans"> / person</span>
                </p>
                <Magnetic className="block w-full">
                  <Link href={enquireHref} className="btn-primary w-full text-center block">
                    Enquire to book
                  </Link>
                </Magnetic>
                <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
                  Our concierge team will confirm availability and payment details with you directly.
                </p>
              </div>
            </Reveal>
          </div>
        </div>

        {hotelsData && hotelsData.items.length > 0 && (
          <Reveal>
            <div className="flex items-end justify-between mb-8 gap-4">
              <h2 className="font-serif text-2xl">Stay nearby in {tour.destination.name}</h2>
              <Link
                href={`/destinations?destinationId=${tour.destinationId}`}
                className="text-sm font-semibold text-primary flex items-center gap-1.5 shrink-0"
              >
                View all <ArrowRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
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
          </Reveal>
        )}
      </div>
    </div>
  );
}
