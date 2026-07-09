import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../drizzle/schema';
import { env } from './env';

const queryClient = postgres(env.DATABASE_URL);

export const db = drizzle(queryClient, { schema });
export { schema };
