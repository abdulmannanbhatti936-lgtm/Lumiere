import { useState } from 'react';
import { Loader2, MapPin, Calendar } from 'lucide-react';
import { Link } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { formatCurrency } from '@/lib/utils';
import Reveal from '@/components/motion/Reveal';
import Magnetic from '@/components/motion/Magnetic';
import HotelCard from '@/components/hotels/HotelCard';

function getInitials(name?: string | null) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return (parts.length > 1 ? `${parts[0][0]}${parts[parts.length - 1][0]}` : parts[0].slice(0, 2)).toUpperCase();
}

export default function MyBookings() {
  const { user, logout } = useAuth();
  const utils = trpc.useUtils();
  const { data: bookings, isLoading, isError } = trpc.bookings.listMine.useQuery();
  const { data: savedStays, isLoading: wishlistLoading } = trpc.wishlist.listMine.useQuery();
  const cancelBooking = trpc.bookings.cancel.useMutation({ onSuccess: () => utils.bookings.listMine.invalidate() });
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const handleCancel = async (id: number) => {
    setCancellingId(id);
    try {
      await cancelBooking.mutateAsync({ id });
    } finally {
      setCancellingId(null);
    }
  };

  const upcoming = (bookings ?? []).filter((b) => b.status === 'pending' || b.status === 'confirmed');
  const past = (bookings ?? []).filter((b) => b.status === 'completed' || b.status === 'cancelled');

  return (
    <div className="bg-background pb-section-gap">
      <div className="container max-w-[1000px]">
        {/* Header */}
        <Reveal className="flex items-center gap-4 mb-14">
          <div className="nav-pill-active w-14 h-14 rounded-full flex items-center justify-center text-white font-bold shrink-0">
            {getInitials(user?.name)}
          </div>
          <div>
            <h1 className="font-serif text-2xl md:text-3xl">{user?.name ?? 'Guest'}</h1>
            <p className="text-muted-foreground text-sm">{user?.email}</p>
          </div>
        </Reveal>

        {isLoading ? (
          <div className="flex justify-center py-24">
            <Loader2 size={40} className="animate-spin text-primary" />
          </div>
        ) : isError ? (
          <div className="glass-panel text-center py-16">
            <p className="text-muted-foreground text-lg">Something went wrong loading your trips. Please try again.</p>
          </div>
        ) : (
          <>
            {/* Upcoming trips */}
            <Reveal className="mb-16">
              <h2 className="font-serif text-2xl mb-6">Upcoming trips</h2>
              {upcoming.length === 0 ? (
                <div className="glass-panel p-10 text-center">
                  <p className="text-muted-foreground mb-6">You don't have any upcoming trips yet.</p>
                  <Magnetic className="inline-block">
                    <Link href="/hotels">
                      <button className="btn-primary">Browse stays</button>
                    </Link>
                  </Magnetic>
                </div>
              ) : (
                <div className="space-y-5">
                  {upcoming.map((booking, i) => (
                    <Reveal key={booking.id} delay={Math.min(i * 0.06, 0.3)}>
                      <Link href={`/hotel/${booking.hotelId}`}>
                        <div className="glass-panel p-7 cursor-pointer border-primary/25">
                          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                            <div>
                              <span
                                className={`inline-block mb-3 ${
                                  booking.status === 'confirmed' ? 'badge-success' : 'badge-warning'
                                }`}
                              >
                                {booking.status === 'confirmed' ? 'Confirmed' : 'Pending'} · {booking.checkIn} — {booking.checkOut}
                              </span>
                              <h3 className="font-serif text-2xl mb-1">{booking.hotel.name}</h3>
                              <p className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                                <MapPin size={14} /> {booking.hotel.city}, {booking.hotel.country}
                              </p>
                              <p className="text-muted-foreground text-sm">{booking.room.name}</p>
                            </div>
                            <div className="text-right flex flex-col items-end gap-3 shrink-0">
                              <p className="font-serif text-2xl text-primary">{formatCurrency(Number(booking.totalPrice))}</p>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleCancel(booking.id);
                                }}
                                disabled={cancellingId === booking.id}
                                className="btn-secondary !py-2 text-sm disabled:opacity-50"
                              >
                                {cancellingId === booking.id ? 'Cancelling...' : 'Cancel'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </Reveal>
                  ))}
                </div>
              )}
            </Reveal>

            {/* Saved stays */}
            <Reveal className="mb-16">
              <h2 className="font-serif text-2xl mb-6">Saved stays</h2>
              {wishlistLoading ? (
                <Loader2 size={28} className="animate-spin text-primary" />
              ) : !savedStays || savedStays.length === 0 ? (
                <p className="text-muted-foreground">
                  Tap the heart on any stay to save it here for later.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-gutter">
                  {savedStays.map((hotel) => (
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
                    />
                  ))}
                </div>
              )}
            </Reveal>

            {/* Past trips */}
            <Reveal>
              <h2 className="font-serif text-2xl mb-6">Past trips</h2>
              {past.length === 0 ? (
                <p className="text-muted-foreground">No past trips yet.</p>
              ) : (
                <div className="divide-y divide-border border-t border-b border-border">
                  {past.map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between gap-4 py-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <Calendar size={16} className="text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <p className="font-semibold truncate">{booking.hotel.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {booking.checkIn} — {booking.checkOut}
                          </p>
                        </div>
                      </div>
                      <span className={booking.status === 'completed' ? 'badge-success shrink-0' : 'badge-danger shrink-0'}>
                        {booking.status === 'completed' ? 'Completed' : 'Cancelled'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Reveal>
          </>
        )}

        <div className="mt-16 pt-8 border-t border-border flex items-center justify-between flex-wrap gap-4">
          <Link href="/contact" className="text-sm font-semibold text-primary hover:underline">
            Need help? Contact us →
          </Link>
          <button onClick={() => logout()} className="text-sm font-semibold text-muted-foreground hover:text-destructive">
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}
