import { TRPCError } from '@trpc/server';
import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { protectedProcedure, router } from '../trpc';
import { db, schema } from '../db';

export const wishlistRouter = router({
  listMine: protectedProcedure.query(async ({ ctx }) => {
    const rows = await db.query.wishlists.findMany({
      where: eq(schema.wishlists.userId, ctx.user.sub),
      orderBy: desc(schema.wishlists.createdAt),
      with: { hotel: true },
    });
    return rows.map((row) => row.hotel);
  }),

  listMineIds: protectedProcedure.query(async ({ ctx }) => {
    const rows = await db.query.wishlists.findMany({
      where: eq(schema.wishlists.userId, ctx.user.sub),
      columns: { hotelId: true },
    });
    return rows.map((row) => row.hotelId);
  }),

  add: protectedProcedure.input(z.object({ hotelId: z.coerce.number().int().positive() })).mutation(async ({ input, ctx }) => {
    const existing = await db.query.wishlists.findFirst({
      where: and(eq(schema.wishlists.userId, ctx.user.sub), eq(schema.wishlists.hotelId, input.hotelId)),
    });
    if (existing) return { success: true };

    const hotel = await db.query.hotels.findFirst({ where: eq(schema.hotels.id, input.hotelId) });
    if (!hotel) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Hotel not found.' });
    }

    await db.insert(schema.wishlists).values({ userId: ctx.user.sub, hotelId: input.hotelId });
    return { success: true };
  }),

  remove: protectedProcedure.input(z.object({ hotelId: z.coerce.number().int().positive() })).mutation(async ({ input, ctx }) => {
    await db
      .delete(schema.wishlists)
      .where(and(eq(schema.wishlists.userId, ctx.user.sub), eq(schema.wishlists.hotelId, input.hotelId)));
    return { success: true };
  }),
});
