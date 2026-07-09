import express from 'express';
import cookieParser from 'cookie-parser';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { env } from './env';
import { corsMiddleware } from './middleware/cors.middleware';
import { apiRateLimiter } from './middleware/rateLimit.middleware';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { appRouter } from './routers';
import { createContext } from './trpc';

const app = express();

app.use(corsMiddleware);
app.use(cookieParser());
app.use(express.json());
app.use('/trpc', apiRateLimiter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'identity' });
});

app.use(
  '/trpc',
  createExpressMiddleware({
    router: appRouter,
    createContext,
  }),
);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`Lumiere Identity service listening on http://localhost:${env.PORT}`);
});
