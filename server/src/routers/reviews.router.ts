import { TRPCError } from '@trpc/server';
import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { reviewCreateSchema } from '../../../shared/validation';
import { adminProcedure, protectedProcedure, publicProcedure, router } from '../trpc';
import { db, schema } from '../db';

export const reviewsRouter = router({
  listByHotel: publicProcedure.input(z.object({ hotelId: z.coerce.number().int().positive() })).query(async ({ input }) => {
    return db.query.reviews.findMany({
      where: and(eq(schema.reviews.hotelId, input.hotelId), eq(schema.reviews.approved, true)),
      orderBy: desc(schema.reviews.createdAt),
      with: { user: { columns: { id: true, name: true } } },
    });
  }),

  // Cross-hotel feed of approved reviews for homepage testimonials — real guest
  // quotes rather than fabricated marketing copy.
  listRecent: publicProcedure
    .input(z.object({ limit: z.coerce.number().int().min(1).max(20).default(6) }).optional())
    .query(async ({ input }) => {
      const limit = input?.limit ?? 6;
      return db.query.reviews.findMany({
        where: eq(schema.reviews.approved, true),
        orderBy: desc(schema.reviews.createdAt),
        limit,
        with: {
          user: { columns: { id: true, name: true } },
          hotel: { columns: { id: true, name: true, city: true, country: true } },
        },
      });
    }),

  create: protectedProcedure.input(reviewCreateSchema).mutation(async ({ input, ctx }) => {
    const booking = await db.query.bookings.findFirst({ where: eq(schema.bookings.id, input.bookingId) });
    if (!booking || booking.userId !== ctx.user.sub || booking.hotelId !== input.hotelId) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'You can only review hotels you have booked.' });
    }
    if (booking.status !== 'completed' && booking.status !== 'confirmed') {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'This booking is not eligible for a review yet.' });
    }

    const existing = await db.query.reviews.findFirst({ where: eq(schema.reviews.bookingId, input.bookingId) });
    if (existing) {
      throw new TRPCError({ code: 'CONFLICT', message: 'You have already reviewed this booking.' });
    }

    const [review] = await db
      .insert(schema.reviews)
      .values({
        userId: ctx.user.sub,
        hotelId: input.hotelId,
        bookingId: input.bookingId,
        rating: input.rating,
        comment: input.comment,
        approved: false,
      })
      .returning();
    return review;
  }),

  adminList: adminProcedure
    .input(z.object({ status: z.enum(['pending', 'approved', 'all']).default('pending') }).optional())
    .query(async ({ input }) => {
      const status = input?.status ?? 'pending';
      return db.query.reviews.findMany({
        where: status === 'all' ? undefined : eq(schema.reviews.approved, status === 'approved'),
        orderBy: desc(schema.reviews.createdAt),
        with: { hotel: true, user: { columns: { id: true, name: true, email: true } } },
      });
    }),

  approve: adminProcedure.input(z.object({ id: z.coerce.number().int().positive() })).mutation(async ({ input }) => {
    const [review] = await db
      .update(schema.reviews)
      .set({ approved: true })
      .where(eq(schema.reviews.id, input.id))
      .returning();
    if (!review) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Review not found.' });
    }
    return review;
  }),

  remove: adminProcedure.input(z.object({ id: z.coerce.number().int().positive() })).mutation(async ({ input }) => {
    const [review] = await db.delete(schema.reviews).where(eq(schema.reviews.id, input.id)).returning();
    if (!review) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Review not found.' });
    }
    return { success: true };
  }),
});
