import { TRPCError } from '@trpc/server';
import type { Response } from 'express';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { loginSchema, signupSchema } from '../../../shared/validation';
import { protectedProcedure, publicProcedure, router } from '../trpc';
import { db, schema } from '../db';
import { hashPassword, verifyPassword } from '../utils/password';
import { hashToken } from '../utils/crypto';
import { sendWelcomeEmail } from '../utils/email';
import {
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_MAX_AGE_MS,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt';
import { env } from '../env';

const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_LOCKOUT_MINUTES = 15;

function toSafeUser(user: typeof schema.users.$inferSelect) {
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
}

function setRefreshCookie(res: Response, refreshToken: string) {
  res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: REFRESH_TOKEN_MAX_AGE_MS,
    path: '/',
  });
}

async function issueSession(user: typeof schema.users.$inferSelect, res: Response) {
  const accessToken = signAccessToken({ sub: user.id, email: user.email, role: user.role });

  const [session] = await db
    .insert(schema.sessions)
    .values({
      userId: user.id,
      refreshTokenHash: 'pending',
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_MAX_AGE_MS),
    })
    .returning();

  const refreshToken = signRefreshToken({ sub: user.id, sessionId: session.id });
  await db
    .update(schema.sessions)
    .set({ refreshTokenHash: hashToken(refreshToken) })
    .where(eq(schema.sessions.id, session.id));

  setRefreshCookie(res, refreshToken);
  return accessToken;
}

export const authRouter = router({
  signup: publicProcedure.input(signupSchema).mutation(async ({ input, ctx }) => {
    const existing = await db.query.users.findFirst({ where: eq(schema.users.email, input.email) });
    if (existing) {
      throw new TRPCError({ code: 'CONFLICT', message: 'An account with this email already exists.' });
    }

    const passwordHash = await hashPassword(input.password);
    const [user] = await db
      .insert(schema.users)
      .values({ email: input.email, passwordHash, name: input.name })
      .returning();

    const accessToken = await issueSession(user, ctx.res);
    void sendWelcomeEmail(user.email, user.name);
    return { user: toSafeUser(user), accessToken };
  }),

  login: publicProcedure.input(loginSchema).mutation(async ({ input, ctx }) => {
    const lockoutCutoff = new Date(Date.now() - LOGIN_LOCKOUT_MINUTES * 60 * 1000);
    const recentFailures = await db.query.loginAttempts.findMany({
      where: and(
        eq(schema.loginAttempts.email, input.email),
        eq(schema.loginAttempts.success, false),
        gt(schema.loginAttempts.attemptedAt, lockoutCutoff),
      ),
    });

    if (recentFailures.length >= LOGIN_MAX_ATTEMPTS) {
      throw new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message: `Too many failed attempts. Please try again in ${LOGIN_LOCKOUT_MINUTES} minutes.`,
      });
    }

    const user = await db.query.users.findFirst({ where: eq(schema.users.email, input.email) });
    const passwordValid = user ? await verifyPassword(input.password, user.passwordHash) : false;

    if (!user || !passwordValid) {
      await db.insert(schema.loginAttempts).values({ email: input.email, success: false });
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid email or password.' });
    }

    if (recentFailures.length > 0) {
      await db.delete(schema.loginAttempts).where(eq(schema.loginAttempts.email, input.email));
    }

    const accessToken = await issueSession(user, ctx.res);
    return { user: toSafeUser(user), accessToken };
  }),

  refresh: publicProcedure.mutation(async ({ ctx }) => {
    const refreshToken = ctx.req.cookies?.[REFRESH_TOKEN_COOKIE] as string | undefined;
    if (!refreshToken) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No refresh token provided.' });
    }

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid or expired refresh token.' });
    }

    const session = await db.query.sessions.findFirst({
      where: and(
        eq(schema.sessions.id, payload.sessionId),
        isNull(schema.sessions.revokedAt),
        gt(schema.sessions.expiresAt, new Date()),
      ),
    });

    if (!session || session.refreshTokenHash !== hashToken(refreshToken)) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Session no longer valid.' });
    }

    await db.update(schema.sessions).set({ revokedAt: new Date() }).where(eq(schema.sessions.id, session.id));

    const user = await db.query.users.findFirst({ where: eq(schema.users.id, session.userId) });
    if (!user) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User no longer exists.' });
    }

    const accessToken = await issueSession(user, ctx.res);
    return { user: toSafeUser(user), accessToken };
  }),

  logout: publicProcedure.mutation(async ({ ctx }) => {
    const refreshToken = ctx.req.cookies?.[REFRESH_TOKEN_COOKIE] as string | undefined;
    if (refreshToken) {
      const tokenHash = hashToken(refreshToken);
      await db
        .update(schema.sessions)
        .set({ revokedAt: new Date() })
        .where(and(eq(schema.sessions.refreshTokenHash, tokenHash), isNull(schema.sessions.revokedAt)));
    }
    ctx.res.clearCookie(REFRESH_TOKEN_COOKIE, { path: '/' });
    return { success: true };
  }),

  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await db.query.users.findFirst({ where: eq(schema.users.id, ctx.user.sub) });
    if (!user) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User no longer exists.' });
    }
    return toSafeUser(user);
  }),
});
