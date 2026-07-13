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
import BackButton from '@/components/common/BackButton';
import Reveal from '@/components/motion/Reveal';
import Magnetic from '@/components/motion/Magnetic';
import { calculateNights } from '@/lib/utils';
import { trpc, type RouterOutputs } from '@/lib/trpc';
import { useAuth } from '@/hooks/useAuth';
import { stripePromise } from '@/lib/stripe';

type BookingRecord = RouterOutputs['bookings']['create'];

const BOOKING_STEPS = ['details', 'payment', 'confirm'] as const;
type BookingStep = (typeof BOOKING_STEPS)[number];

const STEP_LABELS: Record<BookingStep, string> = {
  details: 'Details',
  payment: 'Payment',
  confirm: 'Confirm',
};

export default function Booking() {
  const [, params] = useRoute('/booking/:hotelId/:roomId');
  const hotelId = Number(params?.hotelId);
  const roomId = Number(params?.roomId);
  const { user } = useAuth();

  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const [bookingStep, setBookingStep] = useState<BookingStep>('details');
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
        <Loader2 size={40} className="animate-spin text-primary" />
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
    <div className="bg-background pb-section-gap">
      <div className="container max-w-[920px]">
        <div className="pt-6 pb-4">
          <BackButton fallbackHref={`/hotel/${hotelId}`} label="Back to stay" />
        </div>
        <Reveal>
          <h1 className="font-serif text-3xl md:text-4xl mb-10">Complete your booking</h1>
        </Reveal>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-3 md:gap-4 mb-12">
          {BOOKING_STEPS.map((step, i) => {
            const currentIndex = BOOKING_STEPS.indexOf(bookingStep);
            const done = currentIndex > i;
            const active = bookingStep === step;
            return (
              <div key={step} className="flex items-center gap-3 shrink-0">
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border transition-colors ${
                      active || done ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground'
                    }`}
                  >
                    {i + 1}
                  </div>
                  <span className={`text-xs font-semibold whitespace-nowrap ${active ? 'text-primary' : 'text-muted-foreground'}`}>
                    {STEP_LABELS[step]}
                  </span>
                </div>
                {i < BOOKING_STEPS.length - 1 && (
                  <div className={`w-10 md:w-16 h-px ${currentIndex > i ? 'bg-primary' : 'bg-border'}`} />
                )}
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-gutter">
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={bookingStep}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                {/* Details Step: dates + guests + guest info */}
                {bookingStep === 'details' && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="font-serif text-2xl mb-6">Your dates</h2>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="label-field block mb-2">Check-in</label>
                          <input
                            type="date"
                            value={checkIn}
                            min={new Date().toISOString().slice(0, 10)}
                            onChange={(e) => setCheckIn(e.target.value)}
                            className="input-luxury"
                          />
                        </div>
                        <div>
                          <label className="label-field block mb-2">Check-out</label>
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
                      <h3 className="label-field mb-4">Number of guests</h3>
                      <GuestCounter guests={guests} onGuestChange={setGuests} maxGuests={room.capacity} />
                    </div>

                    <div>
                      <h2 className="font-serif text-2xl mb-6">Guest information</h2>
                      <div className="space-y-4">
                        <div>
                          <label className="label-field block mb-2">Full name</label>
                          <input
                            type="text"
                            value={guestName}
                            onChange={(e) => setGuestName(e.target.value)}
                            placeholder={user?.name ?? 'John Doe'}
                            className="input-luxury"
                          />
                        </div>
                        <div>
                          <label className="label-field block mb-2">Email address</label>
                          <input
                            type="email"
                            value={guestEmail}
                            onChange={(e) => setGuestEmail(e.target.value)}
                            placeholder={user?.email ?? 'john@example.com'}
                            className="input-luxury"
                          />
                        </div>
                        <div>
                          <label className="label-field block mb-2">Phone number</label>
                          <input
                            type="tel"
                            value={guestPhone}
                            onChange={(e) => setGuestPhone(e.target.value)}
                            placeholder={user?.phone ?? '+1 (555) 123-4567'}
                            className="input-luxury"
                          />
                        </div>
                        <div>
                          <label className="label-field block mb-2">Special requests</label>
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

                    <Magnetic className="block w-full">
                      <button
                        onClick={handleConfirmBooking}
                        disabled={
                          !validDateRange ||
                          checkingAvailability ||
                          !availability?.available ||
                          createBooking.isPending ||
                          createPaymentIntent.isPending
                        }
                        className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {createBooking.isPending || createPaymentIntent.isPending
                          ? 'Preparing payment...'
                          : 'Continue to payment'}{' '}
                        <ArrowRight size={18} />
                      </button>
                    </Magnetic>
                  </div>
                )}

                {/* Payment Step */}
                {bookingStep === 'payment' && clientSecret && stripePromise && (
                  <div className="space-y-6">
                    <h2 className="font-serif text-2xl mb-2">Payment</h2>
                    <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe', variables: { colorPrimary: '#2B3A67', fontFamily: 'Manrope, sans-serif', borderRadius: '10px' } } }}>
                      <PaymentForm onSuccess={() => setBookingStep('confirm')} />
                    </Elements>
                  </div>
                )}

                {bookingStep === 'payment' && !stripePromise && (
                  <p className="text-sm text-destructive">
                    Payments are not configured yet. Set VITE_STRIPE_PUBLISHABLE_KEY to enable checkout.
                  </p>
                )}

                {/* Confirmation Step */}
                {bookingStep === 'confirm' && confirmedBooking && (
                  <div className="space-y-8">
                    <div className="text-center py-10">
                      <div className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center badge-success">
                        <CheckCircle size={32} />
                      </div>
                      <h2 className="font-serif text-3xl mb-3">Booking confirmed</h2>
                      <p className="text-muted-foreground text-lg">
                        Your stay at <strong className="text-foreground">{hotel?.name}</strong> is booked — a confirmation email is on its way.
                      </p>
                    </div>

                    <div className="glass-panel p-7">
                      <h3 className="label-field mb-5">Booking details</h3>
                      <div className="space-y-3 border-b border-border pb-5 mb-5 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Confirmation number</span>
                          <span className="font-semibold text-primary">LUM-{confirmedBooking.id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Guest name</span>
                          <span className="font-semibold">{confirmedBooking.guestName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Email</span>
                          <span className="font-semibold">{confirmedBooking.guestEmail}</span>
                        </div>
                      </div>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Check-in</span>
                          <span className="font-semibold">{confirmedBooking.checkIn}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Check-out</span>
                          <span className="font-semibold">{confirmedBooking.checkOut}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Guests</span>
                          <span className="font-semibold">{confirmedBooking.guests}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total paid</span>
                          <span className="font-semibold text-primary">${confirmedBooking.totalPrice}</span>
                        </div>
                      </div>
                    </div>

                    <Magnetic className="block w-full">
                      <Link href="/my-bookings">
                        <button className="btn-primary w-full">View my trips</button>
                      </Link>
                    </Magnetic>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Order summary */}
          <div className="lg:col-span-2">
            <div className="glass-panel p-7 lg:sticky lg:top-[126px]">
              <h3 className="label-field mb-5">Order summary</h3>

              <div className="space-y-3 border-b border-border pb-5 mb-5">
                <div>
                  <p className="text-sm text-muted-foreground">{hotel?.name}</p>
                  <p className="font-serif text-lg">{room.name}</p>
                </div>
                <p className="text-xs text-muted-foreground">{hotel?.city}</p>
              </div>

              {validDateRange && (
                <div className="space-y-3 mb-5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Check-in</span>
                    <span className="font-semibold">{checkIn}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Check-out</span>
                    <span className="font-semibold">{checkOut}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Guests</span>
                    <span className="font-semibold">{guests}</span>
                  </div>
                </div>
              )}

              <div className="border-t border-border pt-5">
                <PriceBreakdown pricePerNight={pricePerNight} nights={nights} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
