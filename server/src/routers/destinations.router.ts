import { TRPCError } from '@trpc/server';
import { desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { destinationWriteSchema } from '../../../shared/validation';
import { adminProcedure, publicProcedure, router } from '../trpc';
import { db, schema } from '../db';

export const destinationsRouter = router({
  list: publicProcedure
    .input(z.object({ featuredOnly: z.boolean().default(false) }).optional())
    .query(async ({ input }) => {
      return db.query.destinations.findMany({
        where: input?.featuredOnly ? eq(schema.destinations.featured, true) : undefined,
        orderBy: desc(schema.destinations.featured),
      });
    }),

  getById: publicProcedure.input(z.object({ id: z.coerce.number().int().positive() })).query(async ({ input }) => {
    const destination = await db.query.destinations.findFirst({ where: eq(schema.destinations.id, input.id) });
    if (!destination) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Destination not found.' });
    }
    return destination;
  }),

  create: adminProcedure.input(destinationWriteSchema).mutation(async ({ input }) => {
    const [destination] = await db
      .insert(schema.destinations)
      .values({
        ...input,
        latitude: input.latitude?.toFixed(6),
        longitude: input.longitude?.toFixed(6),
      })
      .returning();
    return destination;
  }),

  update: adminProcedure
    .input(z.object({ id: z.coerce.number().int().positive() }).merge(destinationWriteSchema.partial()))
    .mutation(async ({ input }) => {
      const { id, ...changes } = input;
      const [destination] = await db
        .update(schema.destinations)
        .set({
          ...changes,
          latitude: changes.latitude?.toFixed(6),
          longitude: changes.longitude?.toFixed(6),
        })
        .where(eq(schema.destinations.id, id))
        .returning();
      if (!destination) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Destination not found.' });
      }
      return destination;
    }),

  remove: adminProcedure.input(z.object({ id: z.coerce.number().int().positive() })).mutation(async ({ input }) => {
    const [destination] = await db
      .delete(schema.destinations)
      .where(eq(schema.destinations.id, input.id))
      .returning();
    if (!destination) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Destination not found.' });
    }
    return { success: true };
  }),
});
