import { useState } from 'react';
import { Link } from 'wouter';
import { MapPin, Loader2 } from 'lucide-react';
import Globe3D from '@/components/3d/Globe';
import { trpc } from '@/lib/trpc';

export default function Destinations() {
  const [selectedDestinationId, setSelectedDestinationId] = useState<number | null>(null);
  const { data: destinations, isLoading, isError } = trpc.destinations.list.useQuery();

  const selectedDestination = destinations?.find((d) => d.id === selectedDestinationId);

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4">Explore Global Destinations</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Discover luxury hotels in the world's most coveted destinations
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {/* 3D Globe */}
          <div className="lg:col-span-1">
            <div className="card-luxury h-96">
              <h3 className="font-semibold text-foreground mb-4">Interactive Globe</h3>
              <Globe3D />
            </div>
          </div>

          {/* Destinations Grid */}
          <div className="lg:col-span-2">
            {isLoading ? (
              <div className="flex justify-center py-24">
                <Loader2 size={40} className="animate-spin text-accent" />
              </div>
            ) : isError ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">
                  Something went wrong loading destinations. Please try again.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {destinations?.map((destination) => (
                  <div
                    key={destination.id}
                    onClick={() => setSelectedDestinationId(destination.id)}
                    className="card-luxury cursor-pointer group overflow-hidden"
                  >
                    {destination.imageUrl && (
                      <div className="relative w-full h-40 mb-4 overflow-hidden rounded-lg">
                        <img
                          src={destination.imageUrl}
                          alt={destination.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
                      </div>
                    )}

                    <h3 className="text-2xl font-bold mb-2 group-hover:text-accent transition-colors">
                      {destination.name}
                    </h3>

                    <div className="flex items-center gap-2 text-muted-foreground mb-3">
                      <MapPin size={16} />
                      <span className="text-sm">{destination.country}</span>
                    </div>

                    <p className="text-sm text-muted-foreground mb-4">{destination.description}</p>

                    <span className="text-accent font-semibold">Explore →</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Selected Destination Details */}
        {selectedDestination && (
          <div className="card-luxury">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold">
                {selectedDestination.name}, {selectedDestination.country}
              </h2>
              <button
                onClick={() => setSelectedDestinationId(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <p className="text-muted-foreground text-lg mb-6">{selectedDestination.description}</p>

            <Link href={`/hotels?city=${encodeURIComponent(selectedDestination.name)}`}>
              <button className="btn-primary w-full">View Hotels in {selectedDestination.name}</button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
