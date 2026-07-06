import type { Request, Response } from 'express';
import { appRouter } from './routers';
import type { AccessTokenPayload } from './utils/jwt';

// Minimal fake req/res — enough for routers that only touch ctx.user, plus
// auth.signup/login which call ctx.res.cookie() as a side effect we don't assert on.
export function createTestCaller(user: AccessTokenPayload | null = null) {
  const req = { headers: {}, cookies: {} } as unknown as Request;
  const res = {
    cookie: () => res,
    clearCookie: () => res,
  } as unknown as Response;

  return appRouter.createCaller({ req, res, user });
}
