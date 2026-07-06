import rateLimit from 'express-rate-limit';
import { env } from '../env';

// General abuse protection for all API traffic. The 5-tries/15-min login lockout
// is separate business logic tracked in the login_attempts table (see auth.router.ts)
// because it needs to key on email, not just IP, and must survive a server restart.
// Defaults to 10 req/min per the spec; raise RATE_LIMIT_MAX in .env if the SPA's
// batched tRPC calls trip it during normal use.
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'RATE_LIMITED', message: 'Too many requests. Please slow down.' },
});
