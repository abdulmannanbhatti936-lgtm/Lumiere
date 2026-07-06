import { TRPCError } from '@trpc/server';
import { and, asc, desc, eq, gte, ilike, inArray, lte, sql } from 'drizzle-orm';
import { z } from 'zod';
import { hotelWriteSchema, hotelsQuerySchema } from '../../../shared/validation';
import { adminProcedure, publicProcedure, router } from '../trpc';
import { db, schema } from '../db';

async function attachRatings<T extends { id: number }>(hotels: T[]) {
  if (hotels.length === 0) return hotels.map((h) => ({ ...h, averageRating: null as number | null, reviewCount: 0 }));

  const hotelIds = hotels.map((h) => h.id);
  const aggregates = await db
    .select({
      hotelId: schema.reviews.hotelId,
      averageRating: sql<string>`avg(${schema.reviews.rating})`,
      reviewCount: sql<string>`count(*)`,
    })
    .from(schema.reviews)
    .where(and(inArray(schema.reviews.hotelId, hotelIds), eq(schema.reviews.approved, true)))
    .groupBy(schema.reviews.hotelId);

  const byHotelId = new Map(aggregates.map((a) => [a.hotelId, a]));
  return hotels.map((hotel) => {
    const agg = byHotelId.get(hotel.id);
    return {
      ...hotel,
      averageRating: agg ? Math.round(Number(agg.averageRating) * 10) / 10 : null,
      reviewCount: agg ? Number(agg.reviewCount) : 0,
    };
  });
}

export const hotelsRouter = router({
  list: publicProcedure.input(hotelsQuerySchema).query(async ({ input }) => {
    const conditions = [
      input.search ? ilike(schema.hotels.name, `%${input.search}%`) : undefined,
      input.city ? ilike(schema.hotels.city, `%${input.city}%`) : undefined,
      input.destinationId ? eq(schema.hotels.destinationId, input.destinationId) : undefined,
      input.minPrice !== undefined ? gte(schema.hotels.basePrice, input.minPrice.toFixed(2)) : undefined,
      input.maxPrice !== undefined ? lte(schema.hotels.basePrice, input.maxPrice.toFixed(2)) : undefined,
      input.minStars !== undefined ? gte(schema.hotels.starRating, input.minStars) : undefined,
    ].filter((c) => c !== undefined);

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const orderBy =
      input.sortBy === 'price_asc'
        ? asc(schema.hotels.basePrice)
        : input.sortBy === 'price_desc'
          ? desc(schema.hotels.basePrice)
          : input.sortBy === 'rating'
            ? desc(schema.hotels.starRating)
            : desc(schema.hotels.createdAt);

    const [rows, [{ total }]] = await Promise.all([
      db.query.hotels.findMany({
        where,
        orderBy,
        limit: input.limit,
        offset: (input.page - 1) * input.limit,
        with: { destination: true },
      }),
      db.select({ total: sql<string>`count(*)` }).from(schema.hotels).where(where),
    ]);

    const items = await attachRatings(rows);

    return {
      items,
      pagination: {
        page: input.page,
        limit: input.limit,
        total: Number(total),
        totalPages: Math.ceil(Number(total) / input.limit),
      },
    };
  }),

  getById: publicProcedure.input(z.object({ id: z.coerce.number().int().positive() })).query(async ({ input }) => {
    const hotel = await db.query.hotels.findFirst({
      where: eq(schema.hotels.id, input.id),
      with: {
        destination: true,
        rooms: true,
        reviews: {
          where: eq(schema.reviews.approved, true),
          orderBy: desc(schema.reviews.createdAt),
          with: { user: { columns: { id: true, name: true } } },
        },
      },
    });
    if (!hotel) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Hotel not found.' });
    }
    const [withRating] = await attachRatings([hotel]);
    return withRating;
  }),

  getBySlug: publicProcedure.input(z.object({ slug: z.string().min(1) })).query(async ({ input }) => {
    const hotel = await db.query.hotels.findFirst({
      where: eq(schema.hotels.slug, input.slug),
      with: {
        destination: true,
        rooms: true,
        reviews: {
          where: eq(schema.reviews.approved, true),
          orderBy: desc(schema.reviews.createdAt),
          with: { user: { columns: { id: true, name: true } } },
        },
      },
    });
    if (!hotel) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Hotel not found.' });
    }
    const [withRating] = await attachRatings([hotel]);
    return withRating;
  }),

  create: adminProcedure.input(hotelWriteSchema).mutation(async ({ input }) => {
    const slug = input.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const existing = await db.query.hotels.findFirst({ where: eq(schema.hotels.slug, slug) });
    if (existing) {
      throw new TRPCError({ code: 'CONFLICT', message: 'A hotel with a similar name already exists.' });
    }

    const [hotel] = await db
      .insert(schema.hotels)
      .values({
        ...input,
        slug,
        basePrice: input.basePrice.toFixed(2),
        latitude: input.latitude?.toFixed(6),
        longitude: input.longitude?.toFixed(6),
      })
      .returning();
    return hotel;
  }),

  update: adminProcedure
    .input(z.object({ id: z.coerce.number().int().positive() }).merge(hotelWriteSchema.partial()))
    .mutation(async ({ input }) => {
      const { id, ...changes } = input;
      const [hotel] = await db
        .update(schema.hotels)
        .set({
          ...changes,
          basePrice: changes.basePrice !== undefined ? changes.basePrice.toFixed(2) : undefined,
          latitude: changes.latitude?.toFixed(6),
          longitude: changes.longitude?.toFixed(6),
          updatedAt: new Date(),
        })
        .where(eq(schema.hotels.id, id))
        .returning();
      if (!hotel) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Hotel not found.' });
      }
      return hotel;
    }),

  remove: adminProcedure.input(z.object({ id: z.coerce.number().int().positive() })).mutation(async ({ input }) => {
    const [hotel] = await db.delete(schema.hotels).where(eq(schema.hotels.id, input.id)).returning();
    if (!hotel) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Hotel not found.' });
    }
    return { success: true };
  }),
});
