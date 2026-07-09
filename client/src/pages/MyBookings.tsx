import { useState } from 'react';
import { Loader2, MapPin, Calendar } from 'lucide-react';
import { Link } from 'wouter';
import { trpc } from '@/lib/trpc';
import { formatCurrency } from '@/lib/utils';
import Reveal from '@/components/motion/Reveal';
import Magnetic from '@/components/motion/Magnetic';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-400/10 text-yellow-400',
  confirmed: 'bg-green-400/10 text-green-400',
  cancelled: 'bg-muted text-muted-foreground',
  completed: 'bg-blue-400/10 text-blue-400',
};

export default function MyBookings() {
  const utils = trpc.useUtils();
  const { data: bookings, isLoading, isError } = trpc.bookings.listMine.useQuery();
  const cancelBooking = trpc.bookings.cancel.useMutation({
    onSuccess: () => utils.bookings.listMine.invalidate(),
  });
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const handleCancel = async (id: number) => {
    setCancellingId(id);
    try {
      await cancelBooking.mutateAsync({ id });
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background py-12 md:py-20">
      <div className="container">
        <Reveal>
          <span className="label-caps mb-4 block">Your Sanctuary</span>
          <h1 className="font-serif text-4xl md:text-5xl mb-12">My Bookings</h1>
        </Reveal>

        {isLoading ? (
          <div className="flex justify-center py-24">
            <Loader2 size={40} className="animate-spin text-accent" />
          </div>
        ) : isError ? (
          <div className="glass-panel text-center py-24">
            <p className="text-muted-foreground text-lg">
              Something went wrong loading your bookings. Please try again.
            </p>
          </div>
        ) : !bookings || bookings.length === 0 ? (
          <div className="glass-panel text-center py-24">
            <p className="text-muted-foreground text-lg mb-6">You haven't made any bookings yet.</p>
            <Magnetic className="inline-block">
              <Link href="/hotels">
                <button className="btn-primary">Browse Hotels</button>
              </Link>
            </Magnetic>
          </div>
        ) : (
          <div className="space-y-6">
            {bookings.map((booking, i) => (
              <Reveal key={booking.id} delay={Math.min(i * 0.06, 0.3)}>
                <div className="glass-panel p-8">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-serif text-2xl">{booking.hotel.name}</h3>
                        <span
                          className={`px-3 py-1 rounded-sm text-xs font-semibold capitalize ${
                            STATUS_STYLES[booking.status] ?? ''
                          }`}
                        >
                          {booking.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                        <MapPin size={16} />
                        <span>
                          {booking.hotel.city}, {booking.hotel.country}
                        </span>
                      </div>
                      <p className="text-muted-foreground text-sm">{booking.room.name}</p>
                      <div className="flex items-center gap-2 text-muted-foreground text-sm mt-2">
                        <Calendar size={16} />
                        <span>
                          {booking.checkIn} → {booking.checkOut} · {booking.guests} guest
                          {booking.guests > 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>

                    <div className="text-right flex flex-col items-end gap-3">
                      <p className="font-serif text-2xl text-accent">
                        {formatCurrency(Number(booking.totalPrice))}
                      </p>
                      {(booking.status === 'pending' || booking.status === 'confirmed') && (
                        <button
                          onClick={() => handleCancel(booking.id)}
                          disabled={cancellingId === booking.id}
                          className="btn-secondary text-sm disabled:opacity-50"
                        >
                          {cancellingId === booking.id ? 'Cancelling...' : 'Cancel Booking'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
