import { useState } from 'react';
import { useRoute } from 'wouter';
import { CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import { Link } from 'wouter';
import { TRPCClientError } from '@trpc/client';
import { Elements } from '@stripe/react-stripe-js';
import { AnimatePresence, motion } from 'framer-motion';
import GuestCounter from '@/components/booking/GuestCounter';
import PriceBreakdown from '@/components/booking/PriceBreakdown';
import PaymentForm from '@/components/booking/PaymentForm';
import Reveal from '@/components/motion/Reveal';
import Magnetic from '@/components/motion/Magnetic';
import { calculateNights } from '@/lib/utils';
import { trpc, type RouterOutputs } from '@/lib/trpc';
import { useAuth } from '@/hooks/useAuth';
import { stripePromise } from '@/lib/stripe';

type BookingRecord = RouterOutputs['bookings']['create'];

const BOOKING_STEPS = ['dates', 'details', 'payment', 'confirmation'] as const;
type BookingStep = (typeof BOOKING_STEPS)[number];

const STEP_LABELS: Record<BookingStep, string> = {
  dates: 'Dates',
  details: 'Guest Details',
  payment: 'Payment',
  confirmation: 'Confirmed',
};

export default function Booking() {
  const [, params] = useRoute('/booking/:hotelId/:roomId');
  const hotelId = Number(params?.hotelId);
  const roomId = Number(params?.roomId);
  const { user } = useAuth();

  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const [bookingStep, setBookingStep] = useState<BookingStep>('dates');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<BookingRecord | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const { data: room, isLoading: roomLoading } = trpc.rooms.getById.useQuery(
    { id: roomId },
    { enabled: Number.isFinite(roomId) },
  );
  const { data: hotel } = trpc.hotels.getById.useQuery({ id: hotelId }, { enabled: Number.isFinite(hotelId) });

  const validDateRange = checkIn && checkOut && checkOut > checkIn;
  const { data: availability, isFetching: checkingAvailability } = trpc.rooms.checkAvailability.useQuery(
    { roomId, checkIn, checkOut },
    { enabled: Number.isFinite(roomId) && !!validDateRange },
  );

  const createBooking = trpc.bookings.create.useMutation();
  const createPaymentIntent = trpc.payments.createPaymentIntent.useMutation();

  const nights = validDateRange ? calculateNights(checkIn, checkOut) : 0;
  const pricePerNight = room ? Number(room.pricePerNight) : 0;

  const handleConfirmBooking = async () => {
    setErrorMessage(null);
    try {
      const booking = await createBooking.mutateAsync({
        hotelId,
        roomId,
        checkIn,
        checkOut,
        guests,
        guestName: guestName || undefined,
        guestEmail: guestEmail || undefined,
        guestPhone: guestPhone || undefined,
        specialRequests: specialRequests || undefined,
      });
      setConfirmedBooking(booking);

      const { clientSecret: secret } = await createPaymentIntent.mutateAsync({ bookingId: booking.id });
      if (!secret) {
        setErrorMessage('Could not initialize payment. Please try again.');
        return;
      }
      setClientSecret(secret);
      setBookingStep('payment');
    } catch (err) {
      setErrorMessage(err instanceof TRPCClientError ? err.message : 'Could not complete your booking.');
    }
  };

  if (roomLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 size={40} className="animate-spin text-accent" />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-muted-foreground text-lg">Room not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 md:py-20">
      <div className="container">
        <Reveal>
          <h1 className="font-serif text-4xl md:text-5xl mb-12">Complete Your Booking</h1>
        </Reveal>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Step Indicator */}
            <div className="flex items-center justify-center md:justify-start gap-3 md:gap-4 mb-14 overflow-x-auto">
              {BOOKING_STEPS.map((step, i) => {
                const currentIndex = BOOKING_STEPS.indexOf(bookingStep);
                const done = currentIndex > i;
                const active = bookingStep === step;
                return (
                  <div key={step} className="flex items-center gap-3 shrink-0">
                    <div className="flex flex-col items-center gap-2">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold border transition-colors ${
                          active || done
                            ? 'bg-accent text-accent-foreground border-accent'
                            : 'border-border text-muted-foreground'
                        }`}
                      >
                        {i + 1}
                      </div>
                      <span
                        className={`label-caps !text-[9px] whitespace-nowrap ${
                          active ? '!text-accent' : '!text-muted-foreground'
                        }`}
                      >
                        {STEP_LABELS[step]}
                      </span>
                    </div>
                    {i < BOOKING_STEPS.length - 1 && (
                      <div className={`w-8 md:w-12 h-px ${currentIndex > i ? 'bg-accent' : 'bg-border'}`} />
                    )}
                  </div>
                );
              })}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={bookingStep}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                {/* Dates Step */}
                {bookingStep === 'dates' && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="font-serif text-2xl mb-6">Select Your Dates</h2>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="label-caps !text-[10px] mb-2 block">Check-in</label>
                          <input
                            type="date"
                            value={checkIn}
                            min={new Date().toISOString().slice(0, 10)}
                            onChange={(e) => setCheckIn(e.target.value)}
                            className="input-luxury"
                          />
                        </div>
                        <div>
                          <label className="label-caps !text-[10px] mb-2 block">Check-out</label>
                          <input
                            type="date"
                            value={checkOut}
                            min={checkIn || new Date().toISOString().slice(0, 10)}
                            onChange={(e) => setCheckOut(e.target.value)}
                            className="input-luxury"
                          />
                        </div>
                      </div>
                      {checkIn && checkOut && !validDateRange && (
                        <p className="text-sm text-destructive">Check-out must be after check-in.</p>
                      )}
                      {validDateRange && checkingAvailability && (
                        <p className="text-sm text-muted-foreground">Checking availability...</p>
                      )}
                      {validDateRange && !checkingAvailability && availability && !availability.available && (
                        <p className="text-sm text-destructive">This room is not available for those dates.</p>
                      )}
                    </div>

                    <div>
                      <h3 className="label-caps !text-foreground mb-6">Number of Guests</h3>
                      <GuestCounter guests={guests} onGuestChange={setGuests} maxGuests={room.capacity} />
                    </div>

                    <Magnetic className="block w-full">
                      <button
                        onClick={() => setBookingStep('details')}
                        disabled={!validDateRange || checkingAvailability || !availability?.available}
                        className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        Continue to Guest Details <ArrowRight size={20} />
                      </button>
                    </Magnetic>
                  </div>
                )}

                {/* Details Step */}
                {bookingStep === 'details' && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="font-serif text-2xl mb-6">Guest Information</h2>

                      <div className="space-y-4">
                        <div>
                          <label className="label-caps !text-[10px] mb-2 block">Full Name</label>
                          <input
                            type="text"
                            value={guestName}
                            onChange={(e) => setGuestName(e.target.value)}
                            placeholder={user?.name ?? 'John Doe'}
                            className="input-luxury"
                          />
                        </div>

                        <div>
                          <label className="label-caps !text-[10px] mb-2 block">Email Address</label>
                          <input
                            type="email"
                            value={guestEmail}
                            onChange={(e) => setGuestEmail(e.target.value)}
                            placeholder={user?.email ?? 'john@example.com'}
                            className="input-luxury"
                          />
                        </div>

                        <div>
                          <label className="label-caps !text-[10px] mb-2 block">Phone Number</label>
                          <input
                            type="tel"
                            value={guestPhone}
                            onChange={(e) => setGuestPhone(e.target.value)}
                            placeholder={user?.phone ?? '+1 (555) 123-4567'}
                            className="input-luxury"
                          />
                        </div>

                        <div>
                          <label className="label-caps !text-[10px] mb-2 block">Special Requests</label>
                          <textarea
                            value={specialRequests}
                            onChange={(e) => setSpecialRequests(e.target.value)}
                            placeholder="Any special requests? (optional)"
                            className="input-luxury min-h-24 resize-none"
                          />
                        </div>
                      </div>
                    </div>

                    {errorMessage && <p className="text-sm font-medium text-destructive">{errorMessage}</p>}

                    <div className="flex gap-4">
                      <button onClick={() => setBookingStep('dates')} className="btn-secondary flex-1">
                        Back
                      </button>
                      <Magnetic className="flex-1 block">
                        <button
                          onClick={handleConfirmBooking}
                          disabled={createBooking.isPending || createPaymentIntent.isPending}
                          className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {createBooking.isPending || createPaymentIntent.isPending
                            ? 'Preparing payment...'
                            : 'Continue to Payment'}{' '}
                          <ArrowRight size={20} />
                        </button>
                      </Magnetic>
                    </div>
                  </div>
                )}

                {/* Payment Step */}
                {bookingStep === 'payment' && clientSecret && stripePromise && (
                  <div className="space-y-8">
                    <h2 className="font-serif text-2xl mb-6">Payment</h2>
                    <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'night' } }}>
                      <PaymentForm onSuccess={() => setBookingStep('confirmation')} />
                    </Elements>
                  </div>
                )}

                {bookingStep === 'payment' && !stripePromise && (
                  <p className="text-sm text-destructive">
                    Payments are not configured yet. Set VITE_STRIPE_PUBLISHABLE_KEY to enable checkout.
                  </p>
                )}

                {/* Confirmation Step */}
                {bookingStep === 'confirmation' && confirmedBooking && (
                  <div className="space-y-8">
                    <div className="text-center py-12">
                      <CheckCircle size={56} className="mx-auto mb-6 text-accent animate-glow" />
                      <span className="label-caps mb-4 block">Confirmed</span>
                      <h2 className="font-serif text-4xl italic mb-4">Your Journey Begins</h2>
                      <p className="text-muted-foreground text-lg">
                        Your reservation is being finalized — you'll get an email confirmation shortly.
                      </p>
                    </div>

                    <div className="glass-panel p-8">
                      <h3 className="label-caps !text-foreground mb-6">Booking Details</h3>

                      <div className="space-y-4 border-b border-border pb-6 mb-6">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Confirmation Number:</span>
                          <span className="font-semibold text-accent">LUM-{confirmedBooking.id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Guest Name:</span>
                          <span className="font-semibold">{confirmedBooking.guestName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Email:</span>
                          <span className="font-semibold">{confirmedBooking.guestEmail}</span>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Check-in:</span>
                          <span className="font-semibold">{confirmedBooking.checkIn}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Check-out:</span>
                          <span className="font-semibold">{confirmedBooking.checkOut}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Guests:</span>
                          <span className="font-semibold">{confirmedBooking.guests}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Paid:</span>
                          <span className="font-semibold text-accent">${confirmedBooking.totalPrice}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <Link href="/my-bookings" className="flex-1">
                        <button className="btn-secondary w-full">View My Bookings</button>
                      </Link>
                      <Link href="/hotels" className="flex-1">
                        <button className="btn-primary w-full">Continue Browsing</button>
                      </Link>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Sidebar - Booking Summary */}
          <div className="lg:col-span-1">
            <div className="glass-panel p-8 sticky top-24">
              <h3 className="label-caps !text-foreground mb-6">Booking Summary</h3>

              <div className="space-y-4 border-b border-border pb-6 mb-6">
                <div>
                  <p className="text-sm text-muted-foreground">{hotel?.name}</p>
                  <p className="font-serif text-lg">{room.name}</p>
                </div>
                <p className="text-xs text-muted-foreground">{hotel?.city}</p>
              </div>

              {validDateRange && (
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Check-in:</span>
                    <span className="font-semibold">{checkIn}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Check-out:</span>
                    <span className="font-semibold">{checkOut}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Guests:</span>
                    <span className="font-semibold">{guests}</span>
                  </div>
                </div>
              )}

              <div className="border-t border-border pt-6">
                <PriceBreakdown pricePerNight={pricePerNight} nights={nights} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
