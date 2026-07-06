import { initTRPC, TRPCError } from '@trpc/server';
import type { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import { verifyAccessToken, type AccessTokenPayload } from './utils/jwt';
import { env } from './env';

export function createContext({ req, res }: CreateExpressContextOptions) {
  let user: AccessTokenPayload | null = null;

  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    try {
      user = verifyAccessToken(authHeader.slice(7));
    } catch {
      user = null;
    }
  }

  return { req, res, user };
}

export type Context = ReturnType<typeof createContext>;

const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        stack: env.NODE_ENV === 'production' ? undefined : error.stack,
      },
    };
  },
});

const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'You must be logged in.' });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

const isAdmin = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'You must be logged in.' });
  }
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required.' });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(isAuthed);
export const adminProcedure = t.procedure.use(isAdmin);
