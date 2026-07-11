import { useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { Star, MapPin, Loader2, Check, Heart } from 'lucide-react';
import { Link } from 'wouter';
import { toast } from 'sonner';
import { TRPCClientError } from '@trpc/client';
import ReviewCard from '@/components/reviews/ReviewCard';
import ReviewForm from '@/components/reviews/ReviewForm';
import RoomSelector from '@/components/booking/RoomSelector';
import Reveal from '@/components/motion/Reveal';
import Magnetic from '@/components/motion/Magnetic';
import { formatCurrency } from '@/lib/utils';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/hooks/useAuth';

const PREVIEW_NIGHTS = 3;
const TAX_RATE = 0.12;

const CATEGORY_LABELS: Record<string, string> = {
  beach: 'Beach',
  city: 'City',
  mountain: 'Mountain',
  boutique: 'Boutique',
};

export default function HotelDetail() {
  const [, params] = useRoute('/hotel/:id');
  const hotelId = Number(params?.id);
  const [, navigate] = useLocation();
  const [selectedRoomId, setSelectedRoomId] = useState<number | undefined>();
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const { data: hotel, isLoading, isError } = trpc.hotels.getById.useQuery(
    { id: hotelId },
    { enabled: Number.isFinite(hotelId) },
  );

  const { data: myBookings } = trpc.bookings.listMine.useQuery(undefined, { enabled: isAuthenticated });
  const { data: wishlistIds } = trpc.wishlist.listMineIds.useQuery(undefined, { enabled: isAuthenticated });
  const isWishlisted = wishlistIds?.includes(hotelId) ?? false;

  const onWishlistError = () => toast.error('Could not update your saved stays. Please try again.');
  const addWishlist = trpc.wishlist.add.useMutation({
    onSuccess: () => utils.wishlist.listMineIds.invalidate(),
    onError: onWishlistError,
  });
  const removeWishlist = trpc.wishlist.remove.useMutation({
    onSuccess: () => utils.wishlist.listMineIds.invalidate(),
    onError: onWishlistError,
  });

  const createReview = trpc.reviews.create.useMutation({
    onSuccess: () => {
      utils.hotels.getById.invalidate({ id: hotelId });
      toast.success('Thanks for your review!');
    },
    onError: (err) => {
      toast.error(err instanceof TRPCClientError ? err.message : 'Could not submit your review.');
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 size={40} className="animate-spin text-primary" />
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

  const selectedRoom = hotel.rooms.find((r) => r.id === selectedRoomId) ?? hotel.rooms[0];
  const pricePerNight = selectedRoom ? Number(selectedRoom.pricePerNight) : 0;
  const subtotal = pricePerNight * PREVIEW_NIGHTS;
  const taxes = Math.round(subtotal * TAX_RATE);
  const total = subtotal + taxes;

  const toggleWishlist = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (isWishlisted) removeWishlist.mutate({ hotelId });
    else addWishlist.mutate({ hotelId });
  };

  return (
    <div className="bg-background pb-section-gap">
      <div className="container">
        {/* Gallery */}
        {galleryImages.length > 0 && (
          <Reveal className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
            <div className="md:col-span-2 h-64 md:h-[420px] rounded-2xl overflow-hidden">
              <img src={galleryImages[0]} alt={hotel.name} fetchPriority="high" decoding="async" className="w-full h-full object-cover" />
            </div>
            <div className="hidden md:grid grid-rows-2 gap-3">
              {(galleryImages.slice(1, 3).length > 0 ? galleryImages.slice(1, 3) : [galleryImages[0], galleryImages[0]]).map(
                (url, i) => (
                  <div key={i} className="h-[200px] rounded-2xl overflow-hidden">
                    <img src={url} alt={`${hotel.name} ${i + 2}`} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                  </div>
                ),
              )}
            </div>
          </Reveal>
        )}

        {/* Header */}
        <Reveal className="mb-10 flex items-start justify-between gap-6 flex-wrap">
          <div>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
              <MapPin size={14} /> {hotel.city}, {hotel.country}
            </div>
            <h1 className="font-serif text-3xl md:text-[36px] mb-4">{hotel.name}</h1>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="inline-flex items-center gap-1 text-sm font-bold bg-muted px-3 py-1.5 rounded-full">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={13} className={i < hotel.starRating ? 'fill-accent text-accent' : 'text-border'} />
                ))}
              </span>
              <span className="label-caps !text-[10px] px-3 py-1.5 rounded-full border border-border">
                {CATEGORY_LABELS[hotel.category] ?? hotel.category}
              </span>
              {hotel.averageRating != null && (
                <span className="text-muted-foreground text-sm">
                  {hotel.averageRating} guest rating ({hotel.reviewCount} reviews)
                </span>
              )}
            </div>
          </div>
          <button
            onClick={toggleWishlist}
            className={`shrink-0 flex items-center gap-2 px-5 py-3 rounded-full border font-semibold text-sm transition-colors ${
              isWishlisted ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary'
            }`}
          >
            <Heart size={16} className={isWishlisted ? 'fill-current' : ''} />
            {isWishlisted ? 'Saved' : 'Save stay'}
          </button>
        </Reveal>

        <p className="text-muted-foreground text-lg leading-relaxed max-w-3xl mb-12">
          {hotel.description || 'No description available yet.'}
        </p>

        {/* Amenities */}
        {hotel.amenities.length > 0 && (
          <Reveal className="mb-14">
            <h2 className="font-serif text-2xl mb-6">Amenities</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-4">
              {hotel.amenities.map((amenity) => (
                <div key={amenity} className="flex items-center gap-2.5 text-sm">
                  <Check size={15} className="text-primary shrink-0" />
                  {amenity}
                </div>
              ))}
            </div>
          </Reveal>
        )}

        {/* Room picker + booking summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter mb-16">
          <div className="lg:col-span-2">
            <h2 className="font-serif text-2xl mb-6">Choose your room</h2>
            <RoomSelector
              rooms={hotel.rooms}
              selectedRoomId={selectedRoom?.id}
              onSelect={setSelectedRoomId}
              hotelCategory={hotel.category}
            />
          </div>

          <div className="lg:col-span-1">
            <div className="glass-panel p-7 lg:sticky lg:top-[126px]">
              <h3 className="label-field mb-5">Booking summary</h3>
              {selectedRoom ? (
                <>
                  <div className="space-y-3 pb-5 border-b border-border mb-5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {formatCurrency(pricePerNight)} × {PREVIEW_NIGHTS} nights
                      </span>
                      <span className="font-semibold">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Taxes &amp; fees</span>
                      <span className="font-semibold">{formatCurrency(taxes)}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-baseline mb-7">
                    <span className="label-caps !text-[10px]">Total</span>
                    <span className="font-serif text-2xl text-primary">{formatCurrency(total)}</span>
                  </div>
                  <Magnetic className="block w-full">
                    <button
                      onClick={() => navigate(`/booking/${hotel.id}/${selectedRoom.id}`)}
                      className="btn-primary w-full"
                    >
                      Reserve now
                    </button>
                  </Magnetic>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No rooms are configured for this hotel yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Reviews */}
        <Reveal className="max-w-3xl">
          <h2 className="font-serif text-2xl mb-6">Guest reviews</h2>
          {hotel.reviews.length > 0 ? (
            <div className="space-y-4 mb-10">
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
            <p className="text-muted-foreground mb-10">No reviews yet — be the first to share your stay.</p>
          )}

          {eligibleBooking && (
            <ReviewForm
              hotelId={hotel.id}
              isLoading={createReview.isPending}
              onSubmit={(rating, comment) => {
                createReview.mutate({ hotelId: hotel.id, bookingId: eligibleBooking.id, rating, comment });
              }}
            />
          )}

          {!isAuthenticated && (
            <p className="text-muted-foreground text-sm">
              <Link href="/login" className="text-primary font-semibold hover:underline">
                Sign in
              </Link>{' '}
              with a confirmed booking to leave a review.
            </p>
          )}
        </Reveal>
      </div>
    </div>
  );
}
