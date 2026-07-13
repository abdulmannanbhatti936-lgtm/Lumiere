import { useState } from 'react';
import type { FormEvent } from 'react';
import { Search, ArrowRight } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { motion } from 'framer-motion';
import Reveal from '@/components/motion/Reveal';
import Magnetic from '@/components/motion/Magnetic';
import HotelCard from '@/components/hotels/HotelCard';
import { HotelCardSkeleton } from '@/components/ui/skeleton';
import { trpc } from '@/lib/trpc';

const CATEGORIES = [
  { label: 'Beach', value: 'beach' },
  { label: 'City', value: 'city' },
  { label: 'Mountain', value: 'mountain' },
  { label: 'Boutique', value: 'boutique' },
];

export default function Home() {
  const [, navigate] = useLocation();
  const [searchCity, setSearchCity] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(2);

  const { data, isLoading } = trpc.hotels.list.useQuery({ sortBy: 'rating', page: 1, limit: 3 });
  const featuredHotels = data?.items ?? [];

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchCity) params.set('city', searchCity);
    if (checkIn) params.set('checkIn', checkIn);
    if (checkOut) params.set('checkOut', checkOut);
    if (guests > 1) params.set('guests', String(guests));
    navigate(params.toString() ? `/hotels?${params.toString()}` : '/hotels');
  };

  return (
    <div className="bg-background">
      {/* Hero */}
      <section className="relative h-[260px] md:h-[560px] w-full">
        {/* Poster image: paints immediately, stays as the fallback for prefers-reduced-motion
            and for the moment before the video has enough data to play. */}
        <img
          src="https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=1800&q=80"
          alt=""
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <video
          autoPlay
          muted
          loop
          playsInline
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover motion-reduce:hidden"
        >
          <source src="/hero-video.webm" type="video/webm" />
        </video>
        <div className="absolute inset-0 hero-vignette" />

        <div className="relative z-10 h-full container flex flex-col justify-center pt-16 md:pt-0">
          <div className="max-w-2xl">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="font-serif text-3xl md:text-6xl leading-[1.05] mb-3 md:mb-6 text-white text-glow"
            >
              Stays worth flying for.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="hidden md:block text-lg text-white/85 max-w-xl leading-relaxed"
            >
              Curated boutique hotels and villas across the world's most striking destinations.
            </motion.p>
          </div>
        </div>

        {/* Desktop search card */}
        <motion.form
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          onSubmit={handleSearch}
          className="hidden md:flex absolute left-1/2 -translate-x-1/2 bottom-[-32px] z-20 card-elevated w-[92%] max-w-4xl items-center divide-x divide-border"
        >
          <div className="flex-1 px-6 py-5">
            <label className="label-field block mb-1.5">Destination</label>
            <input
              type="text"
              value={searchCity}
              onChange={(e) => setSearchCity(e.target.value)}
              placeholder="Santorini, Greece"
              className="w-full bg-transparent text-sm font-semibold text-foreground placeholder-faint focus:outline-none"
            />
          </div>
          <div className="flex-1 px-6 py-5">
            <label className="label-field block mb-1.5">Check in</label>
            <input
              type="date"
              value={checkIn}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setCheckIn(e.target.value)}
              className="w-full bg-transparent text-sm font-semibold text-foreground focus:outline-none"
            />
          </div>
          <div className="flex-1 px-6 py-5">
            <label className="label-field block mb-1.5">Check out</label>
            <input
              type="date"
              value={checkOut}
              min={checkIn || new Date().toISOString().slice(0, 10)}
              onChange={(e) => setCheckOut(e.target.value)}
              className="w-full bg-transparent text-sm font-semibold text-foreground focus:outline-none"
            />
          </div>
          <div className="flex-1 px-6 py-5">
            <label className="label-field block mb-1.5">Guests</label>
            <input
              type="number"
              min={1}
              max={20}
              value={guests}
              onChange={(e) => setGuests(Math.max(1, Number(e.target.value)))}
              className="w-full bg-transparent text-sm font-semibold text-foreground focus:outline-none"
            />
          </div>
          <div className="pl-2 pr-2">
            <Magnetic>
              <button type="submit" className="btn-primary flex items-center gap-2">
                <Search size={16} /> Search
              </button>
            </Magnetic>
          </div>
        </motion.form>

        {/* Mobile condensed search card */}
        <form
          onSubmit={handleSearch}
          className="md:hidden absolute left-4 right-4 bottom-[-28px] z-20 card-elevated flex items-center justify-between px-4 py-3 gap-3"
        >
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{searchCity || 'Where to?'}</p>
            <p className="text-xs text-muted-foreground truncate">
              {checkIn && checkOut ? `${checkIn} — ${checkOut}` : 'Add dates'}
            </p>
          </div>
          <button type="submit" className="btn-primary shrink-0 !px-5 !py-2.5 flex items-center gap-1.5">
            <Search size={14} /> Search
          </button>
        </form>
      </section>

      <div className="pt-14 md:pt-20">
        {/* Category chips */}
        <div className="container">
          <Reveal>
            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              {CATEGORIES.map((cat) => (
                <Link
                  key={cat.value}
                  href={`/hotels?category=${cat.value}`}
                  className="px-5 py-2.5 rounded-full border border-border bg-card text-sm font-semibold hover:border-primary hover:text-primary transition-colors"
                >
                  {cat.label}
                </Link>
              ))}
            </div>
          </Reveal>
        </div>

        {/* Featured stays */}
        <section className="py-section-gap">
          <div className="container">
            <Reveal>
              <div className="flex items-end justify-between mb-10 gap-4">
                <h2 className="font-serif text-[28px] md:text-4xl">Featured stays</h2>
                <Link href="/hotels" className="text-sm font-semibold text-primary flex items-center gap-1.5 shrink-0">
                  View all <ArrowRight size={14} />
                </Link>
              </div>
            </Reveal>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
                <HotelCardSkeleton />
                <HotelCardSkeleton />
                <HotelCardSkeleton />
              </div>
            ) : featuredHotels.length === 0 ? (
              <div className="glass-panel p-16 text-center">
                <p className="text-muted-foreground">No hotels published yet — check back soon.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
                {featuredHotels.map((hotel, i) => (
                  <Reveal key={hotel.id} delay={Math.min(i * 0.08, 0.4)}>
                    <HotelCard
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
                  </Reveal>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
