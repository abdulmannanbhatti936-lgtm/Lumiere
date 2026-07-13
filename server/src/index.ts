import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { env } from './env';
import { corsMiddleware } from './middleware/cors.middleware';
import { apiRateLimiter } from './middleware/rateLimit.middleware';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { appRouter } from './routers';
import { createContext } from './trpc';
import { stripeWebhookHandler } from './webhooks/stripe.webhook';

const app = express();

// Behind a reverse proxy / load balancer in production (Render, Railway, nginx, etc.)
// so express-rate-limit and req.ip read the real client IP from X-Forwarded-For
// instead of the proxy's own address. Trusts exactly one hop.
app.set('trust proxy', 1);

// This is a JSON/tRPC API with no server-rendered HTML, so helmet's CSP is disabled
// (it's meant to constrain inline scripts/styles on HTML responses); the rest of its
// defaults (HSTS, X-Content-Type-Options, Referrer-Policy, etc.) still apply.
app.use(helmet({ contentSecurityPolicy: false }));
app.use(corsMiddleware);
app.use(cookieParser());

// Stripe needs the raw request body to verify the webhook signature, so this route
// must be registered before the global express.json() body parser.
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), stripeWebhookHandler);

app.use(express.json());
app.use('/api/trpc', apiRateLimiter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use(
  '/api/trpc',
  createExpressMiddleware({
    router: appRouter,
    createContext,
  }),
);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`Lumiere Stays API listening on http://localhost:${env.PORT}`);
});
