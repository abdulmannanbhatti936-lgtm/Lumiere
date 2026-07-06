import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { changePasswordSchema, profileUpdateSchema } from '../../../shared/validation';
import { protectedProcedure, router } from '../trpc';
import { db, schema } from '../db';
import { hashPassword, verifyPassword } from '../utils/password';

function toSafeUser(user: typeof schema.users.$inferSelect) {
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
}

export const usersRouter = router({
  updateProfile: protectedProcedure.input(profileUpdateSchema).mutation(async ({ input, ctx }) => {
    const [user] = await db
      .update(schema.users)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(schema.users.id, ctx.user.sub))
      .returning();
    if (!user) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User no longer exists.' });
    }
    return toSafeUser(user);
  }),

  changePassword: protectedProcedure.input(changePasswordSchema).mutation(async ({ input, ctx }) => {
    const user = await db.query.users.findFirst({ where: eq(schema.users.id, ctx.user.sub) });
    if (!user) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User no longer exists.' });
    }

    const valid = await verifyPassword(input.currentPassword, user.passwordHash);
    if (!valid) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Current password is incorrect.' });
    }

    const passwordHash = await hashPassword(input.newPassword);
    await db.update(schema.users).set({ passwordHash, updatedAt: new Date() }).where(eq(schema.users.id, user.id));
    return { success: true };
  }),
});
