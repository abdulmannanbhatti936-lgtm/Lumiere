import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../../drizzle/schema';
import { env } from './env';

// Hosted Postgres (Neon, Render, Supabase, etc.) requires TLS; the local
// docker-compose instance used in dev has no certs configured. Detected from
// the connection string itself (not NODE_ENV) so pointing DATABASE_URL at a
// remote DB always does the right thing regardless of how NODE_ENV is set.
const isLocalDb = /localhost|127\.0\.0\.1/.test(env.DATABASE_URL);
const queryClient = postgres(env.DATABASE_URL, {
  ssl: isLocalDb ? false : 'require',
});

export const db = drizzle(queryClient, { schema });
export { schema };
