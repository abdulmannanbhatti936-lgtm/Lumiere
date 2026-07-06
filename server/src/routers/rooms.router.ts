import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { roomWriteSchema } from '../../../shared/validation';
import { adminProcedure, publicProcedure, router } from '../trpc';
import { db, schema } from '../db';
import { isRoomAvailable } from '../utils/availability';

export const roomsRouter = router({
  listByHotel: publicProcedure
    .input(z.object({ hotelId: z.coerce.number().int().positive() }))
    .query(async ({ input }) => {
      return db.query.rooms.findMany({ where: eq(schema.rooms.hotelId, input.hotelId) });
    }),

  getById: publicProcedure.input(z.object({ id: z.coerce.number().int().positive() })).query(async ({ input }) => {
    const room = await db.query.rooms.findFirst({ where: eq(schema.rooms.id, input.id) });
    if (!room) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Room not found.' });
    }
    return room;
  }),

  checkAvailability: publicProcedure
    .input(
      z
        .object({
          roomId: z.coerce.number().int().positive(),
          checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        })
        .refine((data) => data.checkOut > data.checkIn, { message: 'checkOut must be after checkIn', path: ['checkOut'] }),
    )
    .query(async ({ input }) => {
      const { available, room } = await isRoomAvailable(input.roomId, input.checkIn, input.checkOut);
      if (!room) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Room not found.' });
      }
      return { available };
    }),

  create: adminProcedure.input(roomWriteSchema).mutation(async ({ input }) => {
    const hotel = await db.query.hotels.findFirst({ where: eq(schema.hotels.id, input.hotelId) });
    if (!hotel) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Hotel not found.' });
    }
    const [room] = await db
      .insert(schema.rooms)
      .values({ ...input, pricePerNight: input.pricePerNight.toFixed(2) })
      .returning();
    return room;
  }),

  update: adminProcedure
    .input(z.object({ id: z.coerce.number().int().positive() }).merge(roomWriteSchema.partial()))
    .mutation(async ({ input }) => {
      const { id, ...changes } = input;
      const [room] = await db
        .update(schema.rooms)
        .set({
          ...changes,
          pricePerNight: changes.pricePerNight !== undefined ? changes.pricePerNight.toFixed(2) : undefined,
        })
        .where(eq(schema.rooms.id, id))
        .returning();
      if (!room) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Room not found.' });
      }
      return room;
    }),

  remove: adminProcedure.input(z.object({ id: z.coerce.number().int().positive() })).mutation(async ({ input }) => {
    const [room] = await db.delete(schema.rooms).where(eq(schema.rooms.id, input.id)).returning();
    if (!room) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Room not found.' });
    }
    return { success: true };
  }),
});
