import { TRPCError } from '@trpc/server';
import { desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { tourWriteSchema } from '../../../shared/validation';
import { adminProcedure, publicProcedure, router } from '../trpc';
import { db, schema } from '../db';

export const toursRouter = router({
  list: publicProcedure
    .input(z.object({ destinationId: z.coerce.number().int().positive().optional() }).optional())
    .query(async ({ input }) => {
      return db.query.tours.findMany({
        where: input?.destinationId ? eq(schema.tours.destinationId, input.destinationId) : undefined,
        orderBy: desc(schema.tours.createdAt),
        with: { destination: true },
      });
    }),

  getById: publicProcedure.input(z.object({ id: z.coerce.number().int().positive() })).query(async ({ input }) => {
    const tour = await db.query.tours.findFirst({
      where: eq(schema.tours.id, input.id),
      with: { destination: true },
    });
    if (!tour) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Tour not found.' });
    }
    return tour;
  }),

  create: adminProcedure.input(tourWriteSchema).mutation(async ({ input }) => {
    const [tour] = await db
      .insert(schema.tours)
      .values({ ...input, pricePerPerson: input.pricePerPerson.toFixed(2) })
      .returning();
    return tour;
  }),

  update: adminProcedure
    .input(z.object({ id: z.coerce.number().int().positive() }).merge(tourWriteSchema.partial()))
    .mutation(async ({ input }) => {
      const { id, pricePerPerson, ...changes } = input;
      const [tour] = await db
        .update(schema.tours)
        .set({ ...changes, pricePerPerson: pricePerPerson?.toFixed(2), updatedAt: new Date() })
        .where(eq(schema.tours.id, id))
        .returning();
      if (!tour) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Tour not found.' });
      }
      return tour;
    }),

  remove: adminProcedure.input(z.object({ id: z.coerce.number().int().positive() })).mutation(async ({ input }) => {
    const [tour] = await db.delete(schema.tours).where(eq(schema.tours.id, input.id)).returning();
    if (!tour) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Tour not found.' });
    }
    return { success: true };
  }),
});
