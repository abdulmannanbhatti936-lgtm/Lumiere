import { useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowRight, Sparkles, MapPin, ChevronDown, Compass, Box, Gem, Search, Calendar, Users, Quote, Star } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { motion } from 'framer-motion';
import HotelModel from '@/components/3d/HotelModel';
import Reveal from '@/components/motion/Reveal';
import Magnetic from '@/components/motion/Magnetic';
import AnimatedCounter from '@/components/motion/AnimatedCounter';
import ParallaxLayer from '@/components/motion/ParallaxLayer';
import TiltCard from '@/components/motion/TiltCard';
import HotelCard from '@/components/hotels/HotelCard';
import { HotelCardSkeleton } from '@/components/ui/skeleton';
import { trpc } from '@/lib/trpc';

export default function Home() {
  const [, navigate] = useLocation();
  const [searchCity, setSearchCity] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(2);

  const { data, isLoading } = trpc.hotels.list.useQuery({ sortBy: 'rating', page: 1, limit: 8 });
  const { data: destinations } = trpc.destinations.list.useQuery();
  const { data: recentReviews } = trpc.reviews.listRecent.useQuery({ limit: 6 });
  const featuredHotels = data?.items ?? [];
  const testimonials = (recentReviews ?? []).filter((review) => review.comment);

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
    <div className="min-h-screen bg-background">
      {/* Hero Section with 3D Model */}
      <section className="relative min-h-screen w-full flex items-center overflow-hidden pt-32 pb-16">
        <ParallaxLayer speed={0.15} className="absolute -top-1/4 -left-1/4 w-[60vw] h-[60vw] aurora-glow-teal" />
        <ParallaxLayer speed={0.3} className="absolute -bottom-1/4 -right-1/4 w-[55vw] h-[55vw] aurora-glow" />

        <ParallaxLayer speed={0.55} className="absolute inset-0 opacity-50">
          <HotelModel />
        </ParallaxLayer>

        <div className="absolute inset-0 hero-vignette" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/50 to-transparent" />

        <div className="container relative z-10">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="flex items-center gap-2 mb-6"
            >
              <Sparkles className="text-accent" size={18} />
              <span className="label-caps">Welcome to Luxury Travel</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.15 }}
              className="font-serif text-6xl md:text-7xl leading-[1.05] mb-6 text-glow"
            >
              Stays Beyond <br />
              <span className="gradient-text">The Ordinary</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-lg text-muted-foreground mb-10 max-w-xl leading-relaxed"
            >
              Discover the world's most exquisite hotels with immersive 3D interiors and
              effortless, seamless bookings.
            </motion.p>
          </div>

          {/* Hero Search Bar */}
          <motion.form
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.45 }}
            onSubmit={handleSearch}
            className="glass-panel p-3 md:p-4 max-w-4xl"
          >
            <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-0 md:divide-x md:divide-white/10">
              <div className="flex items-center gap-3 px-3 py-2 flex-1">
                <MapPin size={16} className="text-accent shrink-0" />
                <div className="flex-1">
                  <label className="label-caps !text-[9px] block mb-0.5">Location</label>
                  <input
                    type="text"
                    value={searchCity}
                    onChange={(e) => setSearchCity(e.target.value)}
                    placeholder="Where to?"
                    className="w-full bg-transparent text-sm text-foreground placeholder-muted-foreground focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 px-3 py-2 flex-1">
                <Calendar size={16} className="text-accent shrink-0" />
                <div className="flex-1">
                  <label className="label-caps !text-[9px] block mb-0.5">Check-in</label>
                  <input
                    type="date"
                    value={checkIn}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="w-full bg-transparent text-sm text-foreground focus:outline-none [color-scheme:dark]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 px-3 py-2 flex-1">
                <Calendar size={16} className="text-accent shrink-0" />
                <div className="flex-1">
                  <label className="label-caps !text-[9px] block mb-0.5">Check-out</label>
                  <input
                    type="date"
                    value={checkOut}
                    min={checkIn || new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="w-full bg-transparent text-sm text-foreground focus:outline-none [color-scheme:dark]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 px-3 py-2 flex-1">
                <Users size={16} className="text-accent shrink-0" />
                <div className="flex-1">
                  <label className="label-caps !text-[9px] block mb-0.5">Guests</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={guests}
                    onChange={(e) => setGuests(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-transparent text-sm text-foreground focus:outline-none"
                  />
                </div>
              </div>

              <div className="px-1 py-1">
                <Magnetic className="block w-full md:w-auto">
                  <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2">
                    <Search size={16} /> Search
                  </button>
                </Magnetic>
              </div>
            </div>
          </motion.form>
        </div>

        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 text-muted-foreground"
        >
          <span className="label-caps !text-[10px]">Scroll</span>
          <ChevronDown size={18} className="text-accent" />
        </motion.div>
      </section>

      {/* Stats Strip */}
      <section className="relative z-10 mb-8">
        <div className="container">
          <div className="glass-panel grid grid-cols-3 divide-x divide-white/10 py-8">
            <div className="text-center px-4">
              <div className="font-serif text-3xl md:text-4xl text-accent">
                <AnimatedCounter value={data?.pagination.total ?? 0} suffix="+" />
              </div>
              <p className="label-caps !text-[10px] mt-2">Curated Hotels</p>
            </div>
            <div className="text-center px-4">
              <div className="font-serif text-3xl md:text-4xl text-accent">
                <AnimatedCounter value={destinations?.length ?? 0} />
              </div>
              <p className="label-caps !text-[10px] mt-2">Global Destinations</p>
            </div>
            <div className="text-center px-4">
              <div className="font-serif text-3xl md:text-4xl text-accent">24/7</div>
              <p className="label-caps !text-[10px] mt-2">Private Concierge</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Hotels Carousel */}
      <section className="pb-section-gap">
        <div className="container">
          <Reveal>
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
              <div className="max-w-xl">
                <span className="label-caps mb-4 block">Curated Collections</span>
                <h2 className="font-serif text-4xl md:text-5xl">Featured Properties</h2>
              </div>
              <Link
                href="/hotels"
                className="label-caps border-b border-accent/30 pb-1 hover:border-accent transition-all"
              >
                View All Hotels
              </Link>
            </div>
          </Reveal>
        </div>

        {isLoading ? (
          <div className="container grid grid-cols-1 md:grid-cols-3 gap-gutter">
            <HotelCardSkeleton />
            <HotelCardSkeleton />
            <HotelCardSkeleton />
          </div>
        ) : featuredHotels.length === 0 ? (
          <div className="container">
            <div className="glass-panel p-16 text-center">
              <p className="text-muted-foreground">No hotels published yet — check back soon.</p>
            </div>
          </div>
        ) : (
          <div className="pl-4 sm:pl-6 lg:pl-8">
            <div className="flex gap-gutter overflow-x-auto snap-x snap-mandatory pb-6 pr-6 no-scrollbar">
              {featuredHotels.map((hotel, i) => (
                <Reveal
                  key={hotel.id}
                  delay={Math.min(i * 0.08, 0.4)}
                  className="shrink-0 w-[85vw] sm:w-[380px] snap-start"
                >
                  <HotelCard
                    id={hotel.id}
                    name={hotel.name}
                    city={hotel.city}
                    country={hotel.country}
                    starRating={hotel.starRating}
                    imageUrl={hotel.imageUrl}
                    price={Number(hotel.basePrice)}
                    amenities={hotel.amenities}
                    averageRating={hotel.averageRating}
                    reviewCount={hotel.reviewCount}
                  />
                </Reveal>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Features Section */}
      <section className="py-section-gap border-t border-border">
        <div className="container">
          <Reveal>
            <h2 className="font-serif text-4xl md:text-5xl text-center mb-16">Why Choose Lumière</h2>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
            {[
              {
                title: '3D Hotel Tours',
                description: 'Explore rooms and amenities with immersive, interactive 3D visualization.',
                icon: Box,
              },
              {
                title: 'Global Destinations',
                description: 'Discover luxury hotels across a growing, hand-vetted global portfolio.',
                icon: Compass,
              },
              {
                title: 'Seamless Booking',
                description: 'Reserve your perfect stay in moments, with secure end-to-end payment.',
                icon: Gem,
              },
            ].map((feature, i) => (
              <Reveal key={feature.title} delay={i * 0.12}>
                <div className="glass-panel text-center p-10 h-full">
                  <feature.icon className="mx-auto mb-6 text-accent" size={32} strokeWidth={1.5} />
                  <h3 className="font-serif text-2xl mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      {testimonials.length > 0 && (
        <section className="py-section-gap border-t border-border">
          <div className="container">
            <Reveal>
              <div className="text-center max-w-xl mx-auto mb-16">
                <span className="label-caps mb-4 block">Guest Stories</span>
                <h2 className="font-serif text-4xl md:text-5xl">Told By Those Who Stayed</h2>
              </div>
            </Reveal>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
              {testimonials.slice(0, 6).map((review, i) => (
                <Reveal key={review.id} delay={Math.min(i * 0.1, 0.4)}>
                  <TiltCard className="glass-panel h-full flex flex-col p-6">
                    <Quote className="text-accent mb-4" size={24} strokeWidth={1.5} />
                    <div className="flex items-center gap-1 mb-4">
                      {[...Array(5)].map((_, s) => (
                        <Star
                          key={s}
                          size={13}
                          className={s < review.rating ? 'fill-accent text-accent' : 'text-muted'}
                        />
                      ))}
                    </div>
                    <p className="text-muted-foreground leading-relaxed mb-6 flex-1">"{review.comment}"</p>
                    <div className="pt-4 border-t border-white/10">
                      <p className="font-serif text-lg">{review.user?.name ?? 'Verified Guest'}</p>
                      <p className="label-caps !text-[10px] mt-1">
                        {review.hotel.name}, {review.hotel.city}
                      </p>
                    </div>
                  </TiltCard>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="relative py-section-gap border-t border-border overflow-hidden">
        <div className="absolute inset-0 mesh-gradient opacity-60" />
        <div className="container relative text-center">
          <Reveal>
            <MapPin className="mx-auto mb-6 text-accent" size={28} strokeWidth={1.5} />
            <h2 className="font-serif text-4xl md:text-5xl mb-6">Ready to Book Your Dream Stay?</h2>
            <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
              Join travelers worldwide who have discovered their perfect luxury destination.
            </p>
            <Magnetic>
              <Link href="/hotels">
                <button className="btn-primary text-lg px-10 py-4 flex items-center gap-2">
                  Start Exploring Now <ArrowRight size={18} />
                </button>
              </Link>
            </Magnetic>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
