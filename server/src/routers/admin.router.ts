import { TRPCError } from '@trpc/server';
import { desc, eq, gte, inArray, sql } from 'drizzle-orm';
import { z } from 'zod';
import { adminProcedure, router } from '../trpc';
import { db, schema } from '../db';

const bookingStatusValues = schema.bookingStatusEnum.enumValues;

export const adminRouter = router({
  stats: adminProcedure.query(async () => {
    const [[{ totalUsers }], [{ totalHotels }], [{ totalBookings }], [{ totalRevenue }], [{ pendingReviews }], byStatus] =
      await Promise.all([
        db.select({ totalUsers: sql<string>`count(*)` }).from(schema.users),
        db.select({ totalHotels: sql<string>`count(*)` }).from(schema.hotels),
        db.select({ totalBookings: sql<string>`count(*)` }).from(schema.bookings),
        db
          .select({ totalRevenue: sql<string>`coalesce(sum(${schema.bookings.totalPrice}), 0)` })
          .from(schema.bookings)
          .where(inArray(schema.bookings.status, ['confirmed', 'completed'])),
        db.select({ pendingReviews: sql<string>`count(*)` }).from(schema.reviews).where(sql`${schema.reviews.approved} = false`),
        db
          .select({ status: schema.bookings.status, count: sql<string>`count(*)` })
          .from(schema.bookings)
          .groupBy(schema.bookings.status),
      ]);

    const bookingsByStatus = Object.fromEntries(bookingStatusValues.map((status) => [status, 0])) as Record<
      (typeof bookingStatusValues)[number],
      number
    >;
    for (const row of byStatus) {
      bookingsByStatus[row.status] = Number(row.count);
    }

    return {
      totalUsers: Number(totalUsers),
      totalHotels: Number(totalHotels),
      totalBookings: Number(totalBookings),
      totalRevenue: Number(totalRevenue),
      pendingReviews: Number(pendingReviews),
      bookingsByStatus,
    };
  }),

  monthlyTrend: adminProcedure.query(async () => {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const rows = await db
      .select({
        month: sql<string>`to_char(date_trunc('month', ${schema.bookings.createdAt}), 'Mon YYYY')`,
        monthStart: sql<string>`date_trunc('month', ${schema.bookings.createdAt})`,
        bookings: sql<string>`count(*)`,
        revenue: sql<string>`coalesce(sum(${schema.bookings.totalPrice}) filter (where ${schema.bookings.status} in ('confirmed', 'completed')), 0)`,
      })
      .from(schema.bookings)
      .where(gte(schema.bookings.createdAt, sixMonthsAgo))
      .groupBy(sql`date_trunc('month', ${schema.bookings.createdAt})`)
      .orderBy(sql`date_trunc('month', ${schema.bookings.createdAt})`);

    return rows.map((row) => ({
      month: row.month,
      bookings: Number(row.bookings),
      revenue: Number(row.revenue),
    }));
  }),

  listUsers: adminProcedure
    .input(z.object({ page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(100).default(20) }).optional())
    .query(async ({ input }) => {
      const page = input?.page ?? 1;
      const limit = input?.limit ?? 20;
      return db.query.users.findMany({
        orderBy: desc(schema.users.createdAt),
        limit,
        offset: (page - 1) * limit,
        columns: { passwordHash: false },
      });
    }),

  updateUserRole: adminProcedure
    .input(z.object({ userId: z.coerce.number().int().positive(), role: z.enum(['user', 'admin']) }))
    .mutation(async ({ input, ctx }) => {
      if (input.userId === ctx.user.sub) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'You cannot change your own role.' });
      }

      const [user] = await db
        .update(schema.users)
        .set({ role: input.role, updatedAt: new Date() })
        .where(eq(schema.users.id, input.userId))
        .returning({ id: schema.users.id, name: schema.users.name, email: schema.users.email, role: schema.users.role });

      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found.' });
      }
      return user;
    }),
});
