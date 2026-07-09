import { useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { Star, MapPin, Loader2, Move3d } from 'lucide-react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import RoomPreview from '@/components/3d/RoomPreview';
import ReviewCard from '@/components/reviews/ReviewCard';
import ReviewForm from '@/components/reviews/ReviewForm';
import RoomSelector from '@/components/booking/RoomSelector';
import Reveal from '@/components/motion/Reveal';
import Magnetic from '@/components/motion/Magnetic';
import TiltCard from '@/components/motion/TiltCard';
import { formatCurrency } from '@/lib/utils';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/hooks/useAuth';

const TABS = ['overview', 'rooms', '3d-tour', 'reviews'] as const;

export default function HotelDetail() {
  const [, params] = useRoute('/hotel/:id');
  const hotelId = Number(params?.id);
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>('overview');
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const { data: hotel, isLoading, isError } = trpc.hotels.getById.useQuery(
    { id: hotelId },
    { enabled: Number.isFinite(hotelId) },
  );

  const { data: myBookings } = trpc.bookings.listMine.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const createReview = trpc.reviews.create.useMutation({
    onSuccess: () => utils.hotels.getById.invalidate({ id: hotelId }),
  });

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 size={40} className="animate-spin text-accent" />
      </div>
    );
  }

  if (isError || !hotel) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-muted-foreground text-lg">Hotel not found.</p>
      </div>
    );
  }

  const galleryImages = [hotel.imageUrl, ...hotel.images].filter((url): url is string => !!url);
  const eligibleBooking = myBookings?.find(
    (b) => b.hotelId === hotel.id && (b.status === 'confirmed' || b.status === 'completed'),
  );

  return (
    <div className="relative min-h-screen bg-background py-12 overflow-hidden">
      <div className="absolute -top-1/4 -right-1/4 w-[45vw] h-[45vw] aurora-glow pointer-events-none" />

      <div className="container relative">
        {/* Header */}
        <Reveal className="mb-10">
          <div className="flex items-center gap-1.5 label-caps mb-4">
            <MapPin size={13} />
            {hotel.city}, {hotel.country}
          </div>
          <h1 className="font-serif text-4xl md:text-5xl mb-4">{hotel.name}</h1>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={18}
                  className={i < hotel.starRating ? 'fill-accent text-accent' : 'text-muted'}
                />
              ))}
            </div>
            {hotel.averageRating != null && (
              <span className="text-muted-foreground text-sm">
                {hotel.averageRating} guest rating ({hotel.reviewCount} reviews)
              </span>
            )}
          </div>
        </Reveal>

        {/* Image Gallery */}
        {galleryImages.length > 0 && (
          <Reveal delay={0.1} className="grid grid-cols-1 md:grid-cols-3 gap-gutter mb-12">
            <TiltCard className="md:col-span-2 h-96 rounded-md overflow-hidden">
              <img src={galleryImages[0]} alt={hotel.name} className="w-full h-full object-cover" />
            </TiltCard>
            <div className="grid grid-cols-2 md:grid-cols-1 gap-gutter">
              {galleryImages.slice(1, 3).map((url, i) => (
                <TiltCard key={i} className="h-[9.5rem] rounded-md overflow-hidden">
                  <img src={url} alt={`${hotel.name} ${i + 2}`} className="w-full h-full object-cover" />
                </TiltCard>
              ))}
            </div>
          </Reveal>
        )}

        {/* Tabs */}
        <div className="mb-10 border-b border-border">
          <div className="flex gap-10 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative pb-4 label-caps !text-xs whitespace-nowrap transition-colors ${
                  activeTab === tab ? '!text-accent' : '!text-muted-foreground hover:!text-foreground'
                }`}
              >
                {tab === '3d-tour' ? '3D Tour' : tab}
                {activeTab === tab && (
                  <motion.div
                    layoutId="hotel-detail-tab-underline"
                    className="absolute left-0 right-0 -bottom-px h-[2px] bg-accent"
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
          <div className="lg:col-span-2">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-10">
                <div>
                  <h2 className="font-serif text-2xl mb-4">About This Hotel</h2>
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    {hotel.description || 'No description available yet.'}
                  </p>
                </div>

                {hotel.amenities.length > 0 && (
                  <div>
                    <h3 className="label-caps !text-foreground mb-6">Amenities</h3>
                    <div className="flex flex-wrap gap-3">
                      {hotel.amenities.map((amenity) => (
                        <span
                          key={amenity}
                          className="text-sm border border-border text-muted-foreground px-4 py-2 rounded-sm hover:border-accent hover:text-accent transition-colors"
                        >
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Rooms Tab */}
            {activeTab === 'rooms' && (
              <div className="space-y-6">
                <h2 className="font-serif text-2xl mb-6">Available Rooms</h2>
                <RoomSelector
                  rooms={hotel.rooms}
                  onSelect={(roomId) => navigate(`/booking/${hotel.id}/${roomId}`)}
                />
              </div>
            )}

            {/* 3D Tour Tab */}
            {activeTab === '3d-tour' && (
              <div className="space-y-6">
                <h2 className="font-serif text-2xl mb-6">3D Room Preview</h2>
                <div className="relative h-96 rounded-md overflow-hidden border border-border">
                  <RoomPreview />
                  <div className="absolute top-5 left-5 glass-panel px-4 py-2.5 pointer-events-none">
                    <span className="label-caps !text-[10px]">Live 3D Preview</span>
                  </div>
                  <div className="absolute top-1/2 left-1/3 pointer-events-none">
                    <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md border border-white/40 pulse-ring">
                      <div className="w-1.5 h-1.5 bg-accent rounded-full" />
                    </div>
                  </div>
                </div>
                <p className="text-muted-foreground flex items-center gap-2">
                  <Move3d size={16} className="text-accent" /> Drag to rotate, scroll to zoom.
                </p>
              </div>
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <div className="space-y-8">
                <div>
                  <h2 className="font-serif text-2xl mb-6">Guest Reviews</h2>
                  {hotel.reviews.length > 0 ? (
                    <div className="space-y-4">
                      {hotel.reviews.map((review, i) => (
                        <Reveal key={review.id} delay={Math.min(i * 0.08, 0.4)}>
                          <ReviewCard
                            id={review.id}
                            userName={review.user?.name ?? 'Guest'}
                            rating={review.rating}
                            comment={review.comment ?? ''}
                            createdAt={review.createdAt}
                          />
                        </Reveal>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No reviews yet — be the first to share your stay.</p>
                  )}
                </div>

                {eligibleBooking && (
                  <ReviewForm
                    hotelId={hotel.id}
                    isLoading={createReview.isPending}
                    onSubmit={(rating, comment) => {
                      createReview.mutate({ hotelId: hotel.id, bookingId: eligibleBooking.id, rating, comment });
                    }}
                  />
                )}
              </div>
            )}
          </div>

          {/* Sidebar - Booking Widget */}
          <div className="lg:col-span-1">
            <div className="glass-panel p-8 sticky top-24">
              <h3 className="font-serif text-2xl mb-4">Ready to Book?</h3>
              <p className="text-muted-foreground text-sm mb-6">
                Browse our available rooms and pick the one that suits your stay.
              </p>

              <Magnetic className="block w-full mb-4">
                <button onClick={() => setActiveTab('rooms')} className="btn-primary w-full">
                  View Rooms
                </button>
              </Magnetic>

              <div className="p-5 border border-border rounded-sm">
                <p className="label-caps !text-[10px] mb-2">Starting from</p>
                <p className="font-serif text-3xl text-accent">{formatCurrency(Number(hotel.basePrice))}</p>
                <p className="text-xs text-muted-foreground">per night</p>
              </div>
            </div>
          </div>
        </div>

        {!isAuthenticated && (
          <p className="mt-16 text-muted-foreground text-sm">
            <Link href="/login" className="text-accent hover:underline">
              Sign in
            </Link>{' '}
            with a confirmed booking to leave a review.
          </p>
        )}
      </div>
    </div>
  );
}
