import { useState, useEffect } from 'react';
import { ArrowRight, Sparkles, Loader2 } from 'lucide-react';
import { Link } from 'wouter';
import HotelModel from '@/components/3d/HotelModel';
import { formatCurrency } from '@/lib/utils';
import { trpc } from '@/lib/trpc';

export default function Home() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const { data, isLoading } = trpc.hotels.list.useQuery({ sortBy: 'rating', page: 1, limit: 3 });
  const featuredHotels = data?.items ?? [];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with 3D Model */}
      <section className="relative h-screen flex items-center overflow-hidden">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            transform: `translateY(${scrollY * 0.5}px )`,
          }}
        >
          <HotelModel />
        </div>

        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/50 to-transparent" />

        <div className="container relative z-10">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-6 animate-slide-in-up">
              <Sparkles className="text-accent" size={24} />
              <span className="text-accent font-semibold">Welcome to Luxury Travel</span>
            </div>

            <h1 className="text-6xl md:text-7xl font-bold mb-6 animate-slide-in-up">
              Experience <span className="gradient-text">Immersive</span> Luxury
            </h1>

            <p className="text-xl text-muted-foreground mb-8 max-w-xl animate-slide-in-up">
              Discover the world's most exquisite hotels with interactive 3D tours and seamless bookings.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 animate-slide-in-up">
              <Link href="/hotels">
                <button className="btn-primary flex items-center gap-2">
                  Explore Hotels <ArrowRight size={20} />
                </button>
              </Link>
              <Link href="/destinations">
                <button className="btn-secondary flex items-center gap-2">
                  Browse Destinations
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Hotels Section */}
      <section className="py-20 bg-card border-t border-border">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4">Featured Luxury Hotels</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Handpicked collection of the world's most prestigious accommodations
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 size={40} className="animate-spin text-accent" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuredHotels.map((hotel) => (
                <Link key={hotel.id} href={`/hotel/${hotel.id}`}>
                  <div className="card-luxury cursor-pointer group">
                    <div className="relative w-full h-48 mb-4 overflow-hidden rounded-lg">
                      <img
                        src={hotel.imageUrl ?? undefined}
                        alt={hotel.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                    <h3 className="text-2xl font-bold mb-2 group-hover:text-accent transition-colors">
                      {hotel.name}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {hotel.city}, {hotel.country}
                    </p>
                    <p className="text-accent font-semibold text-lg">
                      {formatCurrency(Number(hotel.basePrice))}/night
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container">
          <h2 className="text-5xl font-bold text-center mb-16">Why Choose Lumiere</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: '3D Hotel Tours',
                description: 'Explore rooms and amenities with immersive 3D visualization',
                icon: '🏨',
              },
              {
                title: 'Global Destinations',
                description: 'Discover luxury hotels in over 150 countries worldwide',
                icon: '🌍',
              },
              {
                title: 'Seamless Booking',
                description: 'Book your perfect stay with just a few clicks',
                icon: '✨',
              },
            ].map((feature, i) => (
              <div key={i} className="card-luxury text-center">
                <div className="text-5xl mb-4">{feature.icon}</div>
                <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-card border-t border-border">
        <div className="container text-center">
          <h2 className="text-5xl font-bold mb-6">Ready to Book Your Dream Stay?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of travelers who have discovered their perfect luxury destination
          </p>
          <Link href="/hotels">
            <button className="btn-primary text-lg px-8 py-4">
              Start Exploring Now
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
}
