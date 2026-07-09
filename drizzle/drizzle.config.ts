import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';
import path from 'path';

config({ path: path.resolve(__dirname, '../server/.env') });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set — copy server/.env.example to server/.env first');
}

// drizzle-kit's snapshot validation does `readFileSync(`./${it}`)` on the existing
// migration path on Windows, which breaks if `out`/`schema` are absolute (it only
// surfaces once there's a prior migration to validate against — a fresh project's
// first `generate` never hits this). CWD-relative paths sidestep it entirely.
function cwdRelative(target: string) {
  return path.relative(process.cwd(), path.resolve(__dirname, target)).replace(/\\/g, '/');
}

export default defineConfig({
  schema: cwdRelative('./schema.ts'),
  out: cwdRelative('./migrations'),
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  verbose: true,
  strict: true,
});
