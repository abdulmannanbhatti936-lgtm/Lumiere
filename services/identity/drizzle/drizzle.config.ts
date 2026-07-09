import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';
import path from 'path';

config({ path: path.resolve(__dirname, '../.env') });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set — copy services/identity/.env.example to services/identity/.env first');
}

export default defineConfig({
  schema: path.resolve(__dirname, './schema.ts').replace(/\\/g, '/'),
  out: path.resolve(__dirname, './migrations').replace(/\\/g, '/'),
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  verbose: true,
  strict: true,
});
