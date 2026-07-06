import { TRPCError } from '@trpc/server';
import { desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { bookingCreateSchema } from '../../../shared/validation';
import { adminProcedure, protectedProcedure, router } from '../trpc';
import { db, schema } from '../db';
import { countOverlappingBookings, nightsBetween } from '../utils/availability';
import { sendBookingCancelledEmail } from '../utils/email';
import { stripe } from '../utils/stripe';

const bookingStatusValues = schema.bookingStatusEnum.enumValues;

export const bookingsRouter = router({
  create: protectedProcedure.input(bookingCreateSchema).mutation(async ({ input, ctx }) => {
    const user = await db.query.users.findFirst({ where: eq(schema.users.id, ctx.user.sub) });
    if (!user) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User no longer exists.' });
    }

    return db.transaction(async (tx) => {
      const room = await tx.query.rooms.findFirst({ where: eq(schema.rooms.id, input.roomId) });
      if (!room || room.hotelId !== input.hotelId) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Room not found for this hotel.' });
      }

      const overlapCount = await countOverlappingBookings(input.roomId, input.checkIn, input.checkOut);
      if (overlapCount >= room.totalUnits) {
        throw new TRPCError({ code: 'CONFLICT', message: 'This room is not available for the selected dates.' });
      }

      const nights = nightsBetween(input.checkIn, input.checkOut);
      const totalPrice = (Number(room.pricePerNight) * nights).toFixed(2);

      const [booking] = await tx
        .insert(schema.bookings)
        .values({
          userId: user.id,
          hotelId: input.hotelId,
          roomId: input.roomId,
          checkIn: input.checkIn,
          checkOut: input.checkOut,
          guests: input.guests,
          totalPrice,
          guestName: input.guestName ?? user.name ?? user.email,
          guestEmail: input.guestEmail ?? user.email,
          guestPhone: input.guestPhone ?? user.phone,
          specialRequests: input.specialRequests,
        })
        .returning();

      return booking;
    });
  }),

  listMine: protectedProcedure.query(async ({ ctx }) => {
    return db.query.bookings.findMany({
      where: eq(schema.bookings.userId, ctx.user.sub),
      orderBy: desc(schema.bookings.createdAt),
      with: { hotel: true, room: true },
    });
  }),

  getById: protectedProcedure.input(z.object({ id: z.coerce.number().int().positive() })).query(async ({ input, ctx }) => {
    const booking = await db.query.bookings.findFirst({
      where: eq(schema.bookings.id, input.id),
      with: { hotel: true, room: true },
    });
    if (!booking) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Booking not found.' });
    }
    if (booking.userId !== ctx.user.sub && ctx.user.role !== 'admin') {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not have access to this booking.' });
    }
    return booking;
  }),

  cancel: protectedProcedure.input(z.object({ id: z.coerce.number().int().positive() })).mutation(async ({ input, ctx }) => {
    const booking = await db.query.bookings.findFirst({
      where: eq(schema.bookings.id, input.id),
      with: { hotel: true, room: true },
    });
    if (!booking) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Booking not found.' });
    }
    if (booking.userId !== ctx.user.sub && ctx.user.role !== 'admin') {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not have access to this booking.' });
    }
    if (booking.status === 'cancelled' || booking.status === 'completed') {
      throw new TRPCError({ code: 'BAD_REQUEST', message: `Booking is already ${booking.status}.` });
    }

    const wasPaid = booking.status === 'confirmed';

    const [updated] = await db
      .update(schema.bookings)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(eq(schema.bookings.id, input.id))
      .returning();

    if (wasPaid && booking.stripePaymentIntentId) {
      try {
        await stripe.refunds.create({ payment_intent: booking.stripePaymentIntentId });
      } catch (error) {
        console.error(`Failed to refund booking ${booking.id}:`, error);
      }
    }

    void sendBookingCancelledEmail(booking.guestEmail, {
      guestName: booking.guestName,
      hotelName: booking.hotel.name,
      roomName: booking.room.name,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      totalPrice: booking.totalPrice,
      confirmationNumber: booking.id,
    });

    return updated;
  }),

  adminList: adminProcedure
    .input(z.object({ page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(100).default(20) }).optional())
    .query(async ({ input }) => {
      const page = input?.page ?? 1;
      const limit = input?.limit ?? 20;
      return db.query.bookings.findMany({
        orderBy: desc(schema.bookings.createdAt),
        limit,
        offset: (page - 1) * limit,
        with: { hotel: true, room: true, user: { columns: { id: true, name: true, email: true } } },
      });
    }),

  updateStatus: adminProcedure
    .input(z.object({ id: z.coerce.number().int().positive(), status: z.enum(bookingStatusValues) }))
    .mutation(async ({ input }) => {
      const [booking] = await db
        .update(schema.bookings)
        .set({ status: input.status, updatedAt: new Date() })
        .where(eq(schema.bookings.id, input.id))
        .returning();
      if (!booking) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Booking not found.' });
      }
      return booking;
    }),
});
