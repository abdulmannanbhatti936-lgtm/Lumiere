import { useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { Star, MapPin, Loader2 } from 'lucide-react';
import { Link } from 'wouter';
import RoomPreview from '@/components/3d/RoomPreview';
import ReviewCard from '@/components/reviews/ReviewCard';
import ReviewForm from '@/components/reviews/ReviewForm';
import RoomSelector from '@/components/booking/RoomSelector';
import { formatCurrency } from '@/lib/utils';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/hooks/useAuth';

export default function HotelDetail() {
  const [, params] = useRoute('/hotel/:id');
  const hotelId = Number(params?.id);
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState('overview');
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
    <div className="min-h-screen bg-background py-12">
      <div className="container">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-bold mb-4">{hotel.name}</h1>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <MapPin size={20} className="text-accent" />
              <span className="text-muted-foreground">
                {hotel.city}, {hotel.country}
              </span>
            </div>
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={20}
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
        </div>

        {/* Image Gallery */}
        {galleryImages.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
            <div className="md:col-span-2 h-96 rounded-lg overflow-hidden">
              <img src={galleryImages[0]} alt={hotel.name} className="w-full h-full object-cover" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              {galleryImages.slice(1, 3).map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={`${hotel.name} ${i + 2}`}
                  className="w-full h-40 object-cover rounded-lg"
                />
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-8 border-b border-border">
          <div className="flex gap-8 overflow-x-auto">
            {['overview', 'rooms', '3d-tour', 'reviews'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 font-semibold capitalize transition-colors ${
                  activeTab === tab
                    ? 'text-accent border-b-2 border-accent'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab === '3d-tour' ? '3D Tour' : tab}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-3xl font-bold mb-4">About This Hotel</h2>
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    {hotel.description || 'No description available yet.'}
                  </p>
                </div>

                {hotel.amenities.length > 0 && (
                  <div>
                    <h3 className="text-2xl font-bold mb-6">Amenities</h3>
                    <div className="flex flex-wrap gap-3">
                      {hotel.amenities.map((amenity) => (
                        <span
                          key={amenity}
                          className="text-sm bg-muted text-muted-foreground px-4 py-2 rounded-full"
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
                <h2 className="text-3xl font-bold mb-6">Available Rooms</h2>
                <RoomSelector
                  rooms={hotel.rooms}
                  onSelect={(roomId) => navigate(`/booking/${hotel.id}/${roomId}`)}
                />
              </div>
            )}

            {/* 3D Tour Tab */}
            {activeTab === '3d-tour' && (
              <div className="space-y-6">
                <h2 className="text-3xl font-bold mb-6">3D Room Preview</h2>
                <div className="h-96 rounded-lg overflow-hidden border border-border">
                  <RoomPreview />
                </div>
                <p className="text-muted-foreground">
                  Explore our luxury rooms in 3D. Use your mouse to rotate and zoom.
                </p>
              </div>
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-3xl font-bold mb-6">Guest Reviews</h2>
                  {hotel.reviews.length > 0 ? (
                    <div className="space-y-4">
                      {hotel.reviews.map((review) => (
                        <ReviewCard
                          key={review.id}
                          id={review.id}
                          userName={review.user?.name ?? 'Guest'}
                          rating={review.rating}
                          comment={review.comment ?? ''}
                          createdAt={review.createdAt}
                        />
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
            <div className="card-luxury sticky top-24">
              <h3 className="text-2xl font-bold mb-6">Ready to Book?</h3>
              <p className="text-muted-foreground text-sm mb-6">
                Browse our available rooms and pick the one that suits your stay.
              </p>

              <button onClick={() => setActiveTab('rooms')} className="btn-primary w-full mb-4">
                View Rooms
              </button>

              <div className="p-4 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground mb-2">Starting from</p>
                <p className="text-2xl font-bold text-accent">{formatCurrency(Number(hotel.basePrice))}</p>
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
