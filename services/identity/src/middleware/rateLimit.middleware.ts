import rateLimit from 'express-rate-limit';
import { env } from '../env';

// General abuse protection for all API traffic. The 5-tries/15-min login lockout
// is separate business logic tracked in the login_attempts table (see auth.router.ts)
// because it needs to key on email, not just IP, and must survive a server restart.
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'RATE_LIMITED', message: 'Too many requests. Please slow down.' },
});
