import type { Request, Response } from 'express';
import type Stripe from 'stripe';
import { eq } from 'drizzle-orm';
import { db, schema } from '../db';
import { stripe } from '../utils/stripe';
import { env } from '../env';
import { sendBookingConfirmedEmail } from '../utils/email';

export async function stripeWebhookHandler(req: Request, res: Response) {
  const signature = req.headers['stripe-signature'];
  if (!signature || !env.STRIPE_WEBHOOK_SECRET) {
    res.status(400).send('Missing Stripe signature or webhook secret not configured.');
    return;
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    res.status(400).send(`Webhook signature verification failed: ${(err as Error).message}`);
    return;
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const bookingId = Number(paymentIntent.metadata.bookingId);

    if (bookingId) {
      const [booking] = await db
        .update(schema.bookings)
        .set({ status: 'confirmed', updatedAt: new Date() })
        .where(eq(schema.bookings.id, bookingId))
        .returning();

      if (booking) {
        const [hotel, room] = await Promise.all([
          db.query.hotels.findFirst({ where: eq(schema.hotels.id, booking.hotelId) }),
          db.query.rooms.findFirst({ where: eq(schema.rooms.id, booking.roomId) }),
        ]);

        if (hotel && room) {
          await sendBookingConfirmedEmail(booking.guestEmail, {
            guestName: booking.guestName,
            hotelName: hotel.name,
            roomName: room.name,
            checkIn: booking.checkIn,
            checkOut: booking.checkOut,
            totalPrice: booking.totalPrice,
            confirmationNumber: booking.id,
          });
        }
      }
    }
  }

  res.json({ received: true });
}
