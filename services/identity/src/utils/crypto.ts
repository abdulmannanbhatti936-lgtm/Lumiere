import { createHash } from 'node:crypto';

// Refresh tokens are already high-entropy signed JWTs, so a fast hash (not bcrypt)
// is sufficient to avoid storing the raw token at rest.
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
