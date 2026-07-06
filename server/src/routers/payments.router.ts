import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { protectedProcedure, router } from '../trpc';
import { db, schema } from '../db';
import { stripe } from '../utils/stripe';

export const paymentsRouter = router({
  createPaymentIntent: protectedProcedure
    .input(z.object({ bookingId: z.coerce.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      const booking = await db.query.bookings.findFirst({ where: eq(schema.bookings.id, input.bookingId) });
      if (!booking || booking.userId !== ctx.user.sub) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Booking not found.' });
      }
      if (booking.status !== 'pending') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: `Booking is already ${booking.status}.` });
      }

      const amountInCents = Math.round(Number(booking.totalPrice) * 100);

      const paymentIntent = booking.stripePaymentIntentId
        ? await stripe.paymentIntents.retrieve(booking.stripePaymentIntentId)
        : await stripe.paymentIntents.create({
            amount: amountInCents,
            currency: 'usd',
            metadata: { bookingId: String(booking.id) },
            receipt_email: booking.guestEmail,
          });

      if (!booking.stripePaymentIntentId) {
        await db
          .update(schema.bookings)
          .set({ stripePaymentIntentId: paymentIntent.id })
          .where(eq(schema.bookings.id, booking.id));
      }

      return { clientSecret: paymentIntent.client_secret };
    }),
});
